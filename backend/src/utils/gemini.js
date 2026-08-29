/* Acá ocurre toda la llamada a la API de gemini */
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()

/* Google cambio los modelos disponibles de gemini el 29/9 */
/* Modelos disponibles 2.0 y 2.5, pro, flash, y flash-lite */
/* https://ai.google.dev/gemini-api/docs/models */
/* Los modelos 2.x expiran en 2026, 2.0 flash en febrero, tenerlo en cuenta */

export async function consultarGemini({ question, schemaDDL, limit }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Falta configurar GEMINI_API_KEY en las variables de entorno (.env).')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const systemInstruction = `
    Eres un asistente que traduce preguntas a SQL en dialecto MariaDB 10.x.
    Reglas IMPORTANTES:
    - Devuelve SOLO una sentencia SELECT válida (una sola línea).
    - Prohibido usar INSERT, UPDATE, DELETE, DROP, ALTER o transacciones.
    - Usa nombres de tablas y columnas EXACTOS del esquema provisto.
    - Si la consulta no especifica límite, añade LIMIT ${limit}.
    - Evita CTEs (WITH) y funciones avanzadas que no sean compatibles con MariaDB.
    - PRIORIDAD: No usar LIMIT dentro de subconsultas que utilicen IN/ALL/ANY/SOME.
    En su lugar, usa JOIN con subconsulta limitada.
    - Si la intención es ambigua, elige la consulta más simple que tenga sentido.
    - Evita JSON_TABLE, funcionalidad avanzada de JSON o RETURNING.
    - Evita ORDER BY dentro de subconsultas que también usen LIMIT, salvo que sea indispensable.
    - Usa funciones estándar (COUNT, MIN, MAX, AVG, SUM) en lugar de analíticas (OVER, RANK, etc).
    - Evita errores de sintaxis: no dejes paréntesis abiertos ni SELECTs flotantes.
    `
  let model

  try {
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      systemInstruction: systemInstruction.trim(),
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: 300,
      },
    })
  } catch(e) {
    throw new Error(`Hubo un error al crear el modelo de Gemini: ${String(e)}`)
  }
  
  const userPrompt = `
    Esquema de la base (resumen tipo DDL):

    ${schemaDDL}

    Pregunta del usuario:
    ${question}

    Responde SOLO la SQL.
    `
  try {
    const result = await model.generateContent(userPrompt)
    
    // checkear
    const text = result?.response?.text?.()

    if (!text) {
      throw new Error('La respuesta de Gemini está vacía o no contiene texto.')
    }

    const sql = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim()
    return sql
  } catch (e) {
    throw new Error(`Hubo un error al enviar la consulta a Gemini: ${String(e)}`)
  }
}