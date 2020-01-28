import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import Slot from 'react-styleguidist/lib/client/rsg-components/Slot';
import Context from 'react-styleguidist/lib/client/rsg-components/Context';

import Preview from './Preview';
import PlaygroundRenderer from './PlaygroundRenderer';
import { DisplayModes, ExampleModes } from '../consts';

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

  render() {
    const { code, activeTab } = this.state;
    const { evalInContext, index, name, settings, exampleMode } = this.props;
    const { displayMode } = this.context;
    // const isExampleHidden = exampleMode === ExampleModes.hide;
    // const isEditorHidden = settings.noeditor || isExampleHidden;
    const preview = <Preview code={code} evalInContext={evalInContext} name={name} />;

    return (
      <div>
        <PlaygroundRenderer
          name={name}
          exampleIndex={index}
          padded={!!settings.padded}
          preview={preview}
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
