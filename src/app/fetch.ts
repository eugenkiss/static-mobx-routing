// Mocked server

import {sleep} from 'app/utils'
import {devToolsStore} from 'app/devtools'

// http://stackoverflow.com/a/19303725/283607
let seed = 1
function random() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
}

const username = 'admin'
const password = 'admin'
let isLoggedIn = true
const mockPosts = []

const words = [
  'escape', 'is', 'a', 'car', 'and', 'yet', 'when', 'he', 'go', 'there', 'it', 'is', 'Kurt Russel', 'who',
  'during', 'if', 'Snake', 'as', 'the', 'but', 'suddenly', 'never', 'gun', 'explosion', 'New York', 'punk',
  'fly', 'plane', 'futuristic', 'because', 'prison', 'does'
]

function mkSentence(words) {
  let s = []
  const limit = 1 + 12 * random()
  const len = words.length
  for (let i = 0; i < limit; i++) {
    const chosen = words[Math.round((len - 1) * random())]
    if (i === 0 || chosen !== s[s.length-1]) s.push(chosen)
  }
  s[0] = s[0].charAt(0).toUpperCase() + s[0].slice(1)
  return s.join(' ') + (random() > 0.1 ? '.' : '?')
}

function mkTitle(words) {
  let s = []
  words = words.map(w => w.charAt(0).toUpperCase() + w.slice(1))
  const limit = 1 + 6 * random()
  const len = words.length
  for (let i = 0; i < limit; i++) {
    const chosen = words[Math.round((len - 1) * random())]
    if (i === 0 || chosen !== s[s.length-1]) s.push(chosen)
  }
  return s.join(' ')
}

function genText() {
  let s = ''
  const limit = 300 + random() * 200
  for (let i = 0; i < limit; i++) {
    s += mkSentence(words) + ' '
    if (random() > 0.9) s += '\n\n'
  }
  return s
}

for (let i = 0; i < 12; i++) {
  mockPosts.push({
    id: i,
    title: mkTitle(words),
    text: genText(),
  })
}

function mkResponse(data: any) {
  return {
    ok: true,
    json: () => Promise.resolve(JSON.parse(JSON.stringify(data))),
  }
}

function mkError(status: number, message: string) {
  return {
    ok: false,
    status: status,
    json: () => Promise.resolve({ error: true, message: message })
  }
}

export async function fetch(url: string, options: any): Promise<any> {
  const dvStore = devToolsStore
  await sleep(dvStore.delay + (dvStore.delay * dvStore.variance) * ((random() - 0.5) * 2))
  if (random() > (1 - dvStore.errorProb)) throw new Error('Mocked network error')
  try {
    const path = parseUrl(url).pathname
    const method = options.method
    const body = options.body && JSON.parse(options.body)
    let match = path.match(/^\/login\/?$/)
    if (match && method === 'POST') {
      if (body.username === username && body.password === password) {
        isLoggedIn = true
        return mkResponse(true)
      }
      return mkError(403, 'Wrong password or username')
    }
    if (!isLoggedIn) return mkError(401, 'Unauthorized')
    match = path.match(/^\/me\/?$/)
    if (match && method === 'GET') return mkResponse({ id: 0, name: 'Admin' })
    match = path.match(/^\/posts\/?$/)
    if (match) {
      if (method === 'GET') return mkResponse(mockPosts)
      if (method === 'POST') {
        if (!body.title) return mkError(400, `Post needs a title`)
        const id = mockPosts.length
        const newPost = Object.assign({}, body, { id })
        mockPosts.push(newPost)
        return mkResponse(newPost)
      }
    }
    match = path.match(/^\/posts\/([0-9]+)\/?$/)
    if (match) {
      const id = parseInt(match[1])
      const post = mockPosts.find(p => p.id === id)
      if (post == null) return mkError(404, `Post(${id}) not found`)
      if (method === 'GET') return mkResponse(post)
      if (method === 'PATCH') {
        delete body.id
        if (!body.title) return mkError(400, `Post needs a title`)
        Object.assign(post, body)
        return mkResponse(post)
      }
    }
    match = path.match(/^\/logout\/?$/)
    if (match) {
      isLoggedIn = false
      return mkResponse(true)
    }
    return mkError(500, `PATH '${path}' not found for method '${method}'`)
  } catch (e) {
    return mkError(500, e.message)
  }
}

// http://stackoverflow.com/a/39308026/283607
function parseUrl(url) {
  const m = url.match(/^(([^:\/?#]+:)?(?:\/\/(([^\/?#:]*)(?::([^\/?#:]*))?)))?([^?#]*)(\?[^#]*)?(#.*)?$/),
    r = {
      hash: m[8] || "",                    // #asd
      host: m[3] || "",                    // localhost:257
      hostname: m[4] || "",                // localhost
      href: m[0] || "",                    // http://localhost:257/deploy/?asd=asd#asd
      origin: m[1] || "",                  // http://localhost:257
      pathname: m[6] || (m[1] ? "/" : ""), // /deploy/
      port: m[5] || "",                    // 257
      protocol: m[2] || "",                // http:
      search: m[7] || ""                   // ?asd=asd
    };
  if (r.protocol.length == 2) {
    r.protocol = "file:///" + r.protocol.toUpperCase();
    r.origin = r.protocol + "//" + r.host;
  }
  r.href = r.origin + r.pathname + r.search + r.hash;
  return m && r;
}
