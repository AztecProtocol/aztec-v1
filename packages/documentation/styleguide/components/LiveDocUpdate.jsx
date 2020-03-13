import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Block,
} from '@aztec/guacamole-ui';
import parse from 'comment-parser';
import {
  zkAssetApis,
  zkNoteApis,
  userApis,
} from '../config/apis';
import MethodArgumentRenderer from './MethodArgumentRenderer';
import MethodDescription from './MethodDescription';
import MethodExplanation from './MethodExplanation';
import MethodReturnRenderer from './MethodReturnRenderer';
import parseTagsForAPI from '../utils/parseTagsForAPI';

const apiTypeMapping = {
  ZkAsset: zkAssetApis,
  ZkNote: zkNoteApis,
  Account: userApis,
};

class LiveDocUpdate extends Component {
  state = {
    parsedDescription: [],
    parsedReturns: [],
    parsedArguments: [],
  };

  componentDidMount() {
    this.parseSource();
  }

  componentDidUpdate(prevProps) {
    const { name: prevName } = prevProps;
    const { name } = this.props;

    if (prevName !== name && name.includes('.')) {
      this.parseSource();
    }
  }

  parseSource = async () => {
    const {
      name,
    } = this.props;

    const apiType = Object.keys(apiTypeMapping)
      .find(type => apiTypeMapping[type].indexOf(name) >= 0);
    if (!apiType) return;

    const urlPath = process.env.NODE_ENV === 'development'
      ? '../../public'
      : '';
    const response = await fetch(`${urlPath}/apis/${apiType}.js`);
    const apiText = await response.text();
    const parsedTags = parse(apiText.toString());

    let APItags;
    try {
      APItags = parseTagsForAPI(name, parsedTags);
    } catch (error) {
      throw new Error(`Could not fetch docs for API method '${name}'.`);
    }

    const parsedArguments = APItags.tags.filter(({ tag }) => tag !== 'returns'
      && tag !== 'function'
      && tag !== 'description');

    const parsedReturns = APItags.tags.filter(({ tag }) => tag === 'returns');

    const parsedDescription = APItags.tags.filter(({ tag }) => tag === 'description');

    this.setState({
      parsedArguments,
      parsedReturns,
      parsedDescription: parsedDescription[0],
    });
  };

  render() {
    const {
      parsedArguments,
      parsedReturns,
      parsedDescription,
    } = this.state;

    return (
      <Block
        padding="l 0"
      >
        {!!(parsedDescription && parsedDescription.description) && (
          <MethodDescription {...parsedDescription} />
        )}
        {<MethodExplanation />}
        {parsedArguments.length > 0 && <MethodArgumentRenderer methods={parsedArguments} />}
        {parsedReturns.length > 0 && <MethodReturnRenderer methods={parsedReturns} />}
      </Block>
    );
  }
}

LiveDocUpdate.propTypes = {
  name: PropTypes.string.isRequired,
};

export default LiveDocUpdate;
