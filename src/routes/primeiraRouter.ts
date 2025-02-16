import { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'

// import { v4 as uuidv4 } from 'uuid'

const rota = new Hono()

// const users = new Map<string, string>()
// const trackingData = new Map<string, any[]>()

const prisma = new PrismaClient()

// Rota para criar um usuário e gerar um script
rota.post('/api/register', async c => {
  const body = await c.req.json()
  //   const userId = uuidv4()

  //   users.set(body.email, userId)
  const user = await prisma.user.create({
    data: {
      email: body.email,
    },
  })

  //   trackingData.set(userId, [])
  await prisma.tracker.create({
    data: {
      userId: user.id,
    },
  })

  return c.json({
    message: 'Usuário criado com sucesso',
    script: `<script async src="http://localhost:3003/v1/tracker.js?id=${user.id}"></script>`,
  })
})

// <script
// defer
// data-id="fcb43366-7898-48a0-9f42-dba8feca813d"
// src="https://octodash.app/js/index.js"
// ></script>

// Rota para receber dados de rastreamento
rota.post('/api/track', async c => {
  console.log('dipsaprou o tack')

  const body = await c.req.json()
  const { userId, url, referrer, timestamp } = body

  const users = await prisma.user.findUnique({
    where: { id: String(userId) },
  })

  if (!users) {
    return c.json({ error: 'Usuário não encontrado' }, 400)
  }

  //   trackingData.get(userId)?.push({ url, referrer, timestamp })
  await prisma.tracker.create({
    data: {
      userId: users.id,
      url,
      referrer,
      timestamp,
    },
  })

  return c.json({ message: 'Dados recebidos com sucesso' })
})

// Rota para buscar estatísticas do usuário
rota.get('/api/sites/:userId', async c => {
  const userId = c.req.param('userId')

  console.log(userId)

  //   const data = trackingData.get(userId) || []
  const data = await prisma.tracker.findMany({
    where: {
      userId: String(userId),
    },
  })

  return c.json({ visits: data.length, details: data })
})

rota.get('/tracker.js', async c => {
  console.log('entrou')
  const script = `
    (function() {
      const scriptElement = document.currentScript;
      const scriptUrl = new URL(scriptElement.src);
      const userId = scriptUrl.searchParams.get('id');

      if (!userId) {
        console.error('ID do usuário não fornecido.');
        return;
      }

      const data = {
        userId: userId,
        pageUrl: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: \`\${window.screen.width}x\${window.screen.height}\`,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      };

      fetch('rastreiaweb-back.vercel.app/v1/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => {
          if (!response.ok) {
            console.error('Erro ao enviar dados de análise.');
          }
        })
        .catch(error => {
          console.error('Erro na requisição:', error);
        });
    })();
  `

  return c.text(script, 200, { 'Content-Type': 'application/javascript' })
})
rota.get('/tracker1.js', async c => {
  console.log('entrou')
  const script = `
    (function() {
        const userId = new URLSearchParams(window.location.search).get('id');
        if (!userId) return;
        
        fetch("http://localhost:3003/v1/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                url: window.location.href,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            })
        });
    })();
    `
  return c.text(script, 200, { 'Content-Type': 'application/javascript' })
})

// Rota para painel de estatísticas
// rota.get('/api/dashboard/:userId', async c => {
//   const userId = c.req.param('userId')
//   //   const data = trackingData.get(userId) || []
//   const data = await prisma.tracker.findMany({
//     where: {
//       userId: String(userId),
//     },
//   })

//   const stats = data.reduce(
//     (acc, visit) => {
//       acc.totalVisits++
//       acc.pages[visit.url] = (acc.pages[visit?.url] || 0) + 1
//       return acc
//     },
//     { totalVisits: 0, pages: {} } as {
//       totalVisits: number
//       pages: Record<string, number>
//     }
//   )

//   return c.json(stats)
// })

export { rota }
