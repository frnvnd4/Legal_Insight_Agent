from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from pypdf import PdfReader
import os
import shutil

class RAGService:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.embeddings = OpenAIEmbeddings()
        self.persist_directory = f"./db/{session_id}"

    async def process_pdf(self, file_path: str):
        """Extrae texto y crea el vector store persistente."""
        
        if os.path.exists(self.persist_directory):
            shutil.rmtree(self.persist_directory)

        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

        doc = Document(page_content=text, metadata={"source": file_path, "session": self.session_id})
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=350 
        )
        chunks = text_splitter.split_documents([doc])
        
        Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )

    def get_retriever(self):
        """Retorna el objeto retriever directamente para el Agente"""
        if not os.path.exists(self.persist_directory):
            print(f"Advertencia: No hay base de datos en {self.persist_directory}")
            
        return Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
        ).as_retriever(search_kwargs={"k": 10})