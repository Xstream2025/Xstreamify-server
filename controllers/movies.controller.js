import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listMovies(req, res) {
  try {
    const q = (req.query.q || '').trim()
    const where = q ? { title: { contains: q, mode: 'insensitive' } } : {}
    const items = await prisma.movie.findMany({ where, orderBy: { id: 'desc' } })
    res.json({ ok: true, items })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'Server error' })
  }
}

export async function getMovie(req, res) {
  try {
    const id = Number(req.params.id)
    const item = await prisma.movie.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' })
    res.json({ ok: true, item })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'Server error' })
  }
}

export async function createMovie(req, res) {
  try {
    const { title, year, director } = req.body
    if (!title) return res.status(400).json({ ok: false, error: 'title required' })
    const item = await prisma.movie.create({
      data: {
        title,
        year: year !== undefined && year !== null && String(year) !== '' ? Number(year) : null,
        director: director ?? null
      }
    })
    res.status(201).json({ ok: true, item })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'Server error' })
  }
}

export async function updateMovie(req, res) {
  try {
    const id = Number(req.params.id)
    const { title, year, director } = req.body
    const item = await prisma.movie.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(year !== undefined ? { year: (String(year) === '' ? null : Number(year)) } : {}),
        ...(director !== undefined ? { director } : {})
      }
    })
    res.json({ ok: true, item })
  } catch (e) {
    console.error(e)
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Not found' })
    res.status(500).json({ ok: false, error: 'Server error' })
  }
}

export async function deleteMovie(req, res) {
  try {
    const id = Number(req.params.id)
    await prisma.movie.delete({ where: { id } })
    res.status(204).end()
  } catch (e) {
    console.error(e)
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Not found' })
    res.status(500).json({ ok: false, error: 'Server error' })
  }
}
