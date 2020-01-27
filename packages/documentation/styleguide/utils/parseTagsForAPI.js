export default function parseTagsForAPI(APIname, parsedTags) {
  let parsedTagsForAPI;
  parsedTags.forEach((methodTag) => {
    if (methodTag.tags[0].name === APIname) {
      parsedTagsForAPI = methodTag;
    }
  });

  if (parsedTagsForAPI.tags === 'undefined') {
    throw new Error('Could not fetch docs for this API method');
  }

  return parsedTagsForAPI;
}
