import os
from typing import TypedDict, Annotated, Sequence
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from datetime import datetime
from app.core.tools import calculate_deadline
from app.services.rag_service import RAGService

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda x, y: x + y]

today_date = datetime.now().strftime("%d de %B de %Y")

SYSTEM_PROMPT = f"""Eres un abogado experto y riguroso.
    CONTEXTO TEMPORAL: Hoy es {today_date}.
    DEBES SEGUIR ESTAS REGLAS:
    1. Si la información NO está en el contrato, di que no se encuentra. NO inventes datos.
    2. Para calcular fechas, usa la herramienta 'calculate_deadline'. 
    3. Si el contrato no dice 'días hábiles', asume que son días corridos (is_business_days=False).
    4. Siempre cita la cláusula o anexo de donde sacaste la información."""
    
def create_retriever_tool(session_id: str):
    rag = RAGService(session_id)
    retriever = rag.get_retriever()

    @tool
    def search_contract(query: str) -> str:
        """
        Busca información específica dentro del contrato cargado. 
        Úsala para responder preguntas sobre cláusulas, fechas, montos y obligaciones.
        """
        docs = retriever.invoke(query)
        if not docs:
            return "No se encontró información sobre esa consulta en el contrato."
        return "\n\n".join([d.page_content for d in docs])
    
    return search_contract

def get_tools(config: dict):
    session_id = config.get("configurable", {}).get("thread_id", "default")
    rag_tool = create_retriever_tool(session_id)
    return [calculate_deadline, rag_tool]

def call_model(state: AgentState, config: dict):
    tools = get_tools(config)
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).bind_tools(tools)
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

def tool_node_dynamic(state: AgentState, config: dict):
    tools = get_tools(config)
    return ToolNode(tools).invoke(state)

def should_continue(state: AgentState):
    if not state["messages"][-1].tool_calls:
        return END
    return "action"

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node_dynamic)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("action", "agent")

app_agent = workflow.compile()