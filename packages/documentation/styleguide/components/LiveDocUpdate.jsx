import React, { Component } from 'react';
import parse from 'comment-parser';
import PropTypes from 'prop-types';
import MethodArgumentRenderer from './MethodArgumentRenderer';
import MethodDescription from './MethodDescription';
import MethodReturnRenderer from './MethodReturnRenderer';
import parseTagsForAPI from '../utils/parseTagsForAPI';
import { zkAssetURL, noteURL } from '../consts';

class LiveDocUpdate extends Component {
  state = {
    parsedDescription: [],
    parsedReturns: [],
    parsedArguments: [],
  };

  componentDidMount() {
    this.parseGitDocs();
  }

  componentDidUpdate(prevProps) {
    const { name: prevName } = prevProps;
    const { name } = this.props;

    if (prevName !== name && name.includes('.')) {
      this.parseGitDocs();
    }
  }

  parseGitDocs = async () => {
    const url = this.selectAPIURL();
    const response = await fetch(url);
    const apiText = await response.text();

    const parsedTags = parse(apiText.toString());
    const { name } = this.props;

    let APItags;
    try {
      APItags = parseTagsForAPI(name, parsedTags);
    } catch (error) {
      throw new Error('Could not fetch docs for this API method');
    }

    const parsedArguments = APItags.tags.filter(tag => tag.tag !== 'returns' && tag.tag !== 'function' && tag.tag !== 'description');

    const parsedReturns = APItags.tags.filter(tag => tag.tag === 'returns');

    const parsedDescription = APItags.tags.filter(tag => tag.tag === 'description');

    this.setState({ parsedArguments, parsedReturns, parsedDescription: parsedDescription[0] });
  };

  selectAPIURL() {
    const { name } = this.props;

    const noteApis = [
      '.equal',
      '.greaterThanOrEqualTo',
      '.export',
      '.grantAccess',
      '.lessThan',
      '.lessThanOrEqualTo',
      '.greaterThan',
    ];
    const zkAssetApis = [
      '.deposit',
      '.send',
      '.withdraw',
      '.balance',
      '.createNoteFromBalance',
      '.fetchNotesFromBalance',
      '.balanceOfLinkedToken',
      '.totalSupplyOfLinkedToken',
      '.allowanceOfLinkedToken',
    ];

    let url;
    if (zkAssetApis.indexOf(name) > -1) {
      url = zkAssetURL;
    } else if (noteApis.indexOf(name) > -1) {
      url = noteURL;
    }
    return url;
  }

  render() {
    const { parsedArguments, parsedReturns, parsedDescription } = this.state;

    return (
      <div>
        <MethodDescription {...parsedDescription} />
        {parsedArguments.length > 0 && <MethodArgumentRenderer methods={parsedArguments} />}
        {parsedReturns.length > 0 && <MethodReturnRenderer methods={parsedReturns} />}
      </div>
    );
  }
}

LiveDocUpdate.propTypes = {
  name: PropTypes.string.isRequired,
};

export default LiveDocUpdate;
