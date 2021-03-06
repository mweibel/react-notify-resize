/**
 * Copyright 2015-present Zippy Technologies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { func, bool } from 'prop-types';
import shallowequal from 'shallowequal';
import autoBind from '@zippytech/react-class/autoBind';

import uglified from '@zippytech/uglified';

const showWarnings = !uglified;

const notifyResizeStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -1,
  overflow: 'hidden',
  display: 'block',
  pointerEvents: 'none',
  opacity: 0,
  direction: 'ltr',
  textAlign: 'start'
};

const expandToolStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'auto'
};

const contractToolStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'auto'
};

const contractToolInnerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '200%',
  height: '200%'
};

class ZippyNotifyResize extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);

    this.state = {
      notifyResizeWidth: 0,
      notifyResizeHeight: 0,

      expandToolWidth: 0,
      expandToolHeight: 0,

      contractToolWidth: 0,
      contractToolHeight: 0
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (typeof nextProps.shouldComponentUpdate === 'function') {
      return nextProps.shouldComponentUpdate(
        nextProps,
        this.props,
        nextState,
        this.state
      );
    }

    return !shallowequal(nextState, this.state) ||
      !shallowequal(nextProps, this.props);
  }

  componentDidMount() {
    if (typeof this.props.onMount === 'function') {
      this.props.onMount(this);
    }

    this.resetResizeTool();

    if (this.props.notifyOnMount) {
      const {
        notifyResizeWidth: width,
        notifyResizeHeight: height
      } = this.notifyResizeSize;
      this.onResize({ width, height });
    }
  }

  render() {
    return (
      <div
        ref="notifyResize"
        style={notifyResizeStyle}
        onScroll={this.checkResize}
      >
        {this.renderExpandTool()}
        {this.renderContractTool()}
      </div>
    );
  }

  renderExpandTool() {
    return (
      <div ref="expandTool" style={expandToolStyle}>
        <div
          ref="expandToolInner"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: this.state.expandToolWidth,
            height: this.state.expandToolHeight
          }}
        />
      </div>
    );
  }

  renderContractTool() {
    return (
      <div
        ref="contractTool"
        style={contractToolStyle}
        onScroll={this.checkResize}
      >
        <div ref="contractInner" style={contractToolInnerStyle} />
      </div>
    );
  }

  resetResizeTool() {
    this.setDimensions();
    this.scrollToBottomExpandTool();
  }

  setDimensions() {
    const {
      notifyResizeWidth,
      notifyResizeHeight
    } = (this.notifyResizeSize = this.getDimensions());

    // Resize tool will be bigger than it's parent by 1 pixel in each direction
    this.setState({
      notifyResizeWidth,
      notifyResizeHeight,
      expandToolWidth: notifyResizeWidth + 1,
      expandToolHeight: notifyResizeHeight + 1
    });
  }

  getDimensions() {
    const notifyResize = this.refs.notifyResize;
    const node = notifyResize.parentElement || notifyResize;

    let size;

    if (typeof this.props.measureSize == 'function') {
      size = this.props.measureSize(node, notifyResize);
    } else {
      size = {
        width: node.offsetWidth,
        height: node.offsetHeight
      };
    }

    return {
      notifyResizeWidth: size.width,
      notifyResizeHeight: size.height
    };
  }

  scrollToBottomExpandTool() {
    // so the scroll moves when element resizes
    if (this.refs.notifyResize) {
      setTimeout(
        () => {
          // scroll to bottom
          const expandTool = this.refs.expandTool;

          if (expandTool) {
            expandTool.scrollTop = expandTool.scrollHeight;
            expandTool.scrollLeft = expandTool.scrollWidth;
          }

          const contractTool = this.refs.contractTool;
          if (contractTool) {
            contractTool.scrollTop = contractTool.scrollHeight;
            contractTool.scrollLeft = contractTool.scrollWidth;
          }
        },
        0
      );
    }
  }

  checkResize() {
    const {
      notifyResizeWidth,
      notifyResizeHeight
    } = this.getDimensions();

    if (
      notifyResizeWidth !== this.state.notifyResizeWidth ||
      notifyResizeHeight !== this.state.notifyResizeHeight
    ) {
      // reset resizeToolDimensions
      this.onResize({
        width: notifyResizeWidth,
        height: notifyResizeHeight
      });
      this.resetResizeTool();
    }
  }

  onResize({ width, height }) {
    if (typeof this.props.onResize === 'function') {
      this.props.onResize({ width, height });
    }
  }
}

ZippyNotifyResize.propTypes = {
  onResize: func,
  onMount: func,
  notifyOnMount: bool
};

const notifyResize = Cmp => class NotifyResizeWrapper extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    this.refComponent = c => {
      this.component = c;
    };
  }
  componentDidMount() {
    const component = this.component;

    // check if they are mounted
    if (!this.notifyResize && showWarnings) {
      console.warn(
        'For notifyResize to work you must render resizeTool from {props.resizeTool}'
      );
    }
  }

  onNotifyResizeMount(notifier) {
    this.notifyResize = notifier;
  }

  onResize(...args) {
    if (typeof this.props.onResize === 'function') {
      this.props.onResize(...args);
    }

    if (typeof this.component.onResize === 'function') {
      this.component.onResize(...args);
    }
  }

  render() {
    const resizeTool = (
      <ZippyNotifyResize
        onResize={this.onResize}
        onMount={this.onNotifyResizeMount}
        notifyOnMount={this.props.notifyOnMount}
      />
    );

    return (
      <Cmp ref={this.refComponent} {...this.props} resizeTool={resizeTool} />
    );
  }
};

export default notifyResize;

export { ZippyNotifyResize as NotifyResize };
