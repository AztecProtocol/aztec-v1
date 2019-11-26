import query from '../utils/query';
import NoteWithViewingQuery from '../queries/NoteWithViewingQuery';

export default async request => query(request, NoteWithViewingQuery);
