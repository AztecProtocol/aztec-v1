import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import Para from 'react-styleguidist/lib/client/rsg-components/Para';
import Slot from 'react-styleguidist/lib/client/rsg-components/Slot';
import Context from 'react-styleguidist/lib/client/rsg-components/Context';
import JsDoc from 'react-styleguidist/lib/client/rsg-components/JsDoc';
import parse from 'comment-parser';

import Preview from './Preview';
import PlaygroundRenderer from './PlaygroundRenderer';
import { DisplayModes, ExampleModes } from '../consts';
import MethodArgumentRenderer from './MethodArgumentRenderer';
import MethodReturnRenderer from './MethodReturnRenderer';

const EXAMPLE_TAB_CODE_EDITOR = 'rsg-code-editor';

class Playground extends Component {
  static propTypes = {
    code: PropTypes.string.isRequired,
    evalInContext: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    exampleMode: PropTypes.string.isRequired,
    settings: PropTypes.object,
  };
  static defaultProps = {
    settings: {},
  };
  static contextType = Context;

  handleChange = debounce((code) => {
    this.setState({
      code,
    });
  }, this.context.config.previewDelay);

  state = {
    code: this.props.code,
    prevCode: this.props.code,
    activeTab: this.getInitialActiveTab() ? EXAMPLE_TAB_CODE_EDITOR : undefined,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { code } = nextProps;
    if (prevState.prevCode !== code) {
      return {
        prevCode: code,
        code,
      };
    }
    return null;
  }

  async componentDidMount() {
    const { parsedArguments, parsedReturns } = await this.parseGitDocs();
    this.setState({ parsedArguments, parsedReturns });
  }

  componentWillUnmount() {
    // Clear pending changes
    this.handleChange.cancel();
  }

  getInitialActiveTab() {
    const expandCode = this.props.exampleMode === ExampleModes.expand;
    return this.props.settings.showcode !== undefined ? this.props.settings.showcode : expandCode;
  }

  handleTabChange = (name) => {
    this.setState((state) => ({
      activeTab: state.activeTab !== name ? name : undefined,
    }));
  };

  parseGitDocs = async () => {
    const url = 'https://raw.githubusercontent.com/AztecProtocol/AZTEC/ebe76f17570a7a30ddf4fa00d7b47db319403aee/packages/extension/src/client/apis/Asset.js';
    const apiText = await fetch(url)
      .then((response) => {
        return response.text();
      })
      .catch((error) => console.log(error));

    const parsedTags = parse(apiText.toString());

    // pick out the tags relevant to the method in question.
    // Need to add a @function tag to all the API
    // method tags which matches the 'name'
    // used in this react to document the method
    const { name } = this.props;
    const parsedTagsForMethod = parsedTags.filter((methodTag) => {
      return methodTag.tags[0].function === name;
    });
    console.log({ name });
    console.log({ parsedTagsForMethod });

    const parsedArguments = parsedTags.filter((tag) => {
      return tag.tags[0].tag !== 'returns';
    });

    const parsedReturns = parsedTags.filter((tag) => {
      return tag.tags[0].tag === 'returns';
    });
    return { parsedArguments, parsedReturns };
  };

  render() {
    const { code, activeTab, parsedArguments, parsedReturns } = this.state;
    const { evalInContext, index, name, settings, exampleMode } = this.props;
    const { displayMode } = this.context;
    // const isExampleHidden = exampleMode === ExampleModes.hide;
    // const isEditorHidden = settings.noeditor || isExampleHidden;
    const preview = <Preview code={code} evalInContext={evalInContext} />;

    let methodArgs;
    let methodReturn;
    if (parsedArguments && parsedReturns) {
      methodArgs = <MethodArgumentRenderer methods={[...parsedArguments]} />;
      methodReturn = <MethodReturnRenderer methods={[...parsedReturns]} />;
    }

    return (
      <div>
        <PlaygroundRenderer
          name={name}
          exampleIndex={index}
          padded={!!settings.padded}
          preview={preview}
          methodArgs={methodArgs}
          methodReturn={methodReturn}
          previewProps={settings.props || {}}
          // tabButtons={<Slot name="exampleTabButtons" active={activeTab} props={{ onClick: this.handleTabChange }} />}
          tabBody={
            <Slot
              name="exampleTabs"
              active={activeTab}
              onlyActive
              // evalInContext passed through to support custom slots that eval code
              props={{ code, onChange: this.handleChange, evalInContext }}
            />
          }
          toolbar={
            <Slot name="exampleToolbar" props={{ name, isolated: displayMode === DisplayModes.example, example: index }} />
          }
        />
      </div>
    );
    // this was at the top of the return
    // isEditorHidden ? (
    //   <Para>{preview}</Para>
    // ) : (
    // );
  }
}

export default Playground;
