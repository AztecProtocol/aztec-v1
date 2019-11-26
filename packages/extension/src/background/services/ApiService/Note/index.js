import query from '../utils/query';
import NoteQuery from '../queries/NoteQuery';

export default async request => query(request, NoteQuery);
