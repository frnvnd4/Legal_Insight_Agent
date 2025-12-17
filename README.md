# Legal Insight Agent

MVP de un asistente legal inteligente basado en Agentes y RAG.

## Cómo levantar el proyecto

### Requisitos Previos
* Python 3.10 o superior.
* Una API Key de OpenAI válida.

### Instalación y Configuración
1. **Clonar el repositorio:**
   ```sh
   git clone https://github.com/frnvnd4/Legal_Insight_Agent.git
   cd Legal_Insight_Agent
   ```

2. **Crear y activar el entorno virtual:**
   ```sh
   cd backend/
   python3 -m venv venv

   # En Windows:
   venv\Scripts\activate

   # En macOS/Linux:
   source venv/bin/activate
   ```

3. **Instalar dependencias:**
   ```sh
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Variables de entorno: Crea un archivo .env dentro de la carpeta /backend con tu clave:**
   ```sh
   echo "OPENAI_API_KEY=tu_api_key_aqui" > .env
   ```

5. **Ejecutar el backend:**
   ```sh
   uvicorn app.main:app --reload
   ```

### Ejecutar el Frontend
1. **Navegar a la carpeta:**
   ```sh
   cd ../frontend
   ```
2. **Instalar dependencias:** 
   ```sh
   npm install
   ```
3. **Ejecutar**
   ```sh
   npm run dev
   ```

## Decisiones de diseño

Implementé un servicio de RAG (backend/services/rag_service) que utiliza PyPDF y RecursiveCharacterTextSplitter para la extracción del texto,se utilizó un chunk_size de 1000 y un chunk_overlap de 350. (Justificación en la pregunta de más abajo). En cuanto al retorno del Retriever utilicé k=10 como parámetro, ya que realizando pruebas con contratos extensos, valores más bajos omitían cláusulas críticas por la densidad del texto. 

Siguiendo con el aislamiento de la sesión, utilicé ChromaDB para mantener la privacidad y el aislamiento de los datos.

Luego para la lógica del agente, decidí utilizar LangGraph ya que realiza un trabajo más exhaustivo para el análisis de la respuesta. Considero que es necesario para la función que va a cumplir que es analizar un contrato. Además es capaz de decidir si debe ejecutar alguna herramienta externa o no y en este caso como se tiene una herramienta personalizada se ajusta mejor al requerimiento. Dentro de la definición del agente también se especifica un PROMPT que asegura que responda como queremos (que sea un abogado experto y que no alucine).

Además para asegurar que no se pierda precisión en la lectura del archivo, implementé dos funciones, la primera para búsqueda semántica que me va a permitir encontrar conceptos legales sin necesidad de que se use la palabra exacta. Y la segunda para el calculo de la fecha crítica que tiene dos tipos de cálculo, uno para días corridos y otro para días hábiles, si el contrato no especifica, se asumen días corridos, de lo contrario se calculan días hábiles. 

Finalmente para decisiones de diseño del frontend, tomé en cuenta tanto las obligaciones como las consideraciones, mostrando los mensajes de estado y utilizando React, TypeScript y TailwindCSS.

## Respuestas a las preguntas de arquitectura y producto

### 1. Estrategia de RAG
* Utilicé RecursiveCharacterTextSplitter con un chunk_size de 1000 y un chunk_overlap de 350.
La decisión se justifica porque los documentos legales suelen ser extensos y la información está distribuida en cláusulas por lo que se necesita un chunk_size lo suficientemente grande que sea capaz de almacenar la cláusula sin perder información de la misma. Y a su vez el chunk_overlap de 350 asegura que  no se pierda el encabezado o numeración de la cláusula o si el chunk_size corta antes la información, no se pierda el contexto.

* Para implementar una mejora para un documento legal de más de 50 páginas, utilizaría Parent Document Retrieval ya que permite indexar fragmentos pequeños para una búsqueda más precisa pero recupera el documento que contiene más información y contexto para entregarle al modelo, evitando respuetas incompletas o pérdida de información.

### 2. Observabilidad
Integraría LangFuse mediante callbacks al invocar al agente, con esto tendría el monitoreo desde que inicia la pregunta (para calcular la latencia de las tools) y luego el costo exacto de tokens por llamada a la API. También me podría servir para hacer versionado de prompts, si cambio el system_prompt podría comparar las respuestas y evaluar que prompt es mejor.

### 3. Escalabilidad
Por la alta demanda, migraría la implementación local de ChromaDB a alguna solución en la nube como Pinecone o Milvus que tienen capacidad para soportar mayor flujo de datos con baja latencia.

En cuanto a la infraestructura, desplegaría el backend en contenedores Docker gestionados por Kubernetes para permitir el escalado horizontal según la demanda de la API e implementaría un sistema de caché con Redis para almacenar el historial de chat de cada sesión optimizando la latencia y reduciendo el costo de los tokens.