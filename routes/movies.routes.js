import { Router } from 'express'
import {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie
} from '../controllers/movies.controller.js'

const router = Router()

router.get('/',       listMovies)     // GET /api/movies
router.get('/search', listMovies)     // GET /api/movies/search?q=term
router.get('/:id',    getMovie)       // GET /api/movies/1
router.post('/',      createMovie)    // POST /api/movies
router.put('/:id',    updateMovie)    // PUT /api/movies/1
router.delete('/:id', deleteMovie)    // DELETE /api/movies/1

export default router
