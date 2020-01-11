import React from 'react';
import { Block, FlexBox, Button, Text, Row, TextInput } from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import Context from 'react-styleguidist/lib/client/rsg-components/Context';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import styles from './preview.module.scss';

import compileCode from '../../utils/compileCode';
import evalInContext from '../../utils/evalInContext';
import splitExampleCode from '../../utils/splitExampleCode';

class PreviewComponent extends React.Component {
  constructor(props) {
    super(props);
  }

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

  state = {
    code: this.props.code,
    prevCode: this.props.code,
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

  compileCode = () => {
    const { code } = this.state;
    const { compilerConfig, onError } = this.props;
    const compiledCode = compileCode(code, compilerConfig, console.log);
    console.log({ compiledCode });

    const { head, example } = splitExampleCode(compiledCode);
    console.log({ example });
    console.log({ head });

    const codeToRun = evalInContext(`
    async () => {
      var state = {}, initialState = {};
      try {
         const result = ${example};
         return result;
      } catch (err) {
        console.log(err)
      }
    }`)();
    console.log({ codeToRun });
  };


  handleChange = debounce((code) => {
    this.setState({
      code,
    });
  }, 100);

  render() {
    const { code, methodName } = this.props;
    return (
      <Block background="white" borderRadius="xs" hasBorder>
        <Block padding="s" hasBorderBottom>
          <Text text={methodName} weight="bold" size="l" />
        </Block>
        <Block background="grey-lightest">
          <FlexBox stretch expand>
            <Editor code={this.state.code} className={styles.textArea} onChange={this.handleChange} />
          </FlexBox>
        </Block>
        <Block
          padding="s"
          background="primary"
          style={{
            borderRadius: '0 0 3px 3px',
          }}
        >
          <FlexBox align="flex-end" stretch expand>
            <Button text="Run Code" onClick={this.compileCode} />
          </FlexBox>
        </Block>
      </Block>
    );
  }
}

PreviewComponent.propTypes = {
  code: PropTypes.string.isRequired,
  methodName: PropTypes.string.isRequired,
};

export default PreviewComponent;
