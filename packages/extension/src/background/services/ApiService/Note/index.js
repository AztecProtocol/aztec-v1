import query from '../utils/query';
import NoteQuery from '../../../../ui/queries/NoteQuery';

export default async request => query(request, NoteQuery);
