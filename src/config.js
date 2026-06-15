import {config}from 'dotenv'
config()


export const BD_HOST = process.env.DB_HOST || process.env.BD_HOST || 'localhost'
export const BD_DATABASE = process.env.DB_DATABASE || process.env.BD_DATABASE || 'base2026'
export const DB_USER = process.env.DB_USER || 'root'
export const DB_PASSWORD = process.env.DB_PASSWORD || ''
export const DB_PORT = Number(process.env.DB_PORT || 3306)
export const PORT = Number(process.env.PORT || 3000)