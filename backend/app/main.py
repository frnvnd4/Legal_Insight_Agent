import os
import uuid
import shutil
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage
from app.services.rag_service import RAGService
from app.agents.legal_agent import app_agent

load_dotenv() 

app = FastAPI(title="Legal Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Solo se admiten archivos PDF")
    
    session_id = str(uuid.uuid4())[:8] 
    temp_path = f"temp_{session_id}.pdf"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
        rag_service = RAGService(session_id=session_id)
        await rag_service.process_pdf(temp_path)
        
        return {
            "status": "success", 
            "session_id": session_id, 
            "message": "Contrato indexado correctamente"
        }
    
    except Exception as e:
        raise HTTPException(500, f"Error al procesar PDF: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/chat")
async def chat(question: str, session_id: str):
    try:
        config = {"configurable": {"thread_id": session_id}}
        inputs = {"messages": [HumanMessage(content=question)]}
        
        result = await app_agent.ainvoke(inputs, config=config)
        
        if not result or "messages" not in result:
             return {"answer": "Error: El agente no produjo mensajes.", "session_id": session_id}
         
        final_answer = result["messages"][-1].content
        return {"answer": final_answer, "session_id": session_id}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(500, f"Error en el agente: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)