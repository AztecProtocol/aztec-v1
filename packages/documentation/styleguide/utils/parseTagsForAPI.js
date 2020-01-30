export default function parseTagsForAPI(APIname, parsedTags) {
  let parsedTagsForAPI;
  parsedTags.forEach((methodTag) => {
    if (methodTag.tags[0].name.split('.')[1] === APIname.split('.')[1]) {
      parsedTagsForAPI = methodTag;
    }
  });

  if (parsedTagsForAPI.tags === 'undefined') {
    throw new Error('Could not fetch docs for this API method');
  }

  return parsedTagsForAPI;
}
