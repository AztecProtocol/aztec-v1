import query from '../utils/query';
import NoteWithViewingQuery from '../../../../ui/queries/NoteWithViewingQuery';

export default async request => query(request, NoteWithViewingQuery);
