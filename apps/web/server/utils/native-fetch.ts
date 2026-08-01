// Native Node.js HTTP fetch for Nitro SSR environments where $fetch may fail
import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

export async function nativeFetch(url: string, options: {
  method?: string
  headers?: Record<string, string>
  timeout?: number
  body?: any
} = {}): Promise<any> {
  const { method = 'GET', headers = {}, timeout = 10000, body } = options

  const parsedUrl = new URL(url)
  const transport = parsedUrl.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = transport.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout,
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json)
        } catch {
          resolve(data)
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timed out after ${timeout}ms`))
    })

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.end()
  })
}