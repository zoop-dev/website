
import { isAuthed } from '../_auth.js';

export async function onRequestGet({ request, env }) {
  return Response.json({ authed: !!(await isAuthed(request, env)) });
}
