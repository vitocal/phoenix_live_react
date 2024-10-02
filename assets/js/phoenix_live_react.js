const loadReact = async () => {
  return {
    React: (await import("react")).default,
    ReactDOM: (await import("react-dom")).default,
    ReactDOMClient: (await import("react-dom/client")).default,
  }
}

let reactRoots = {};

const render = async function (el, target, componentClass, additionalProps = {}, previousProps = {}) {
  const _root = {}
  const { React, ReactDOMClient } = await loadReact();
  let props = el.dataset.liveReactProps ? JSON.parse(el.dataset.liveReactProps) : {};
  if (el.dataset.liveReactMerge) {
    props = { ...previousProps, ...props, ...additionalProps }
  } else {
    props = { ...props, ...additionalProps }
  }

  if (!reactRoots[el.id]) {
    reactRoots[el.id] = ReactDOMClient.createRoot(target);
  }

  const reactElement = React.createElement(componentClass, props);
  reactRoots[el.id].render(reactElement)
  return props;
}

const initLiveReactElement = async function (el, additionalProps) {
  const target = el.nextElementSibling;
  const componentClass = Array.prototype.reduce.call(el.dataset.liveReactClass.split('.'), (acc, el) => { return acc[el] }, window);
  await render(el, target, componentClass, additionalProps);
  return { target: target, componentClass: componentClass };
}

const LiveReact = {
  async mounted() {
    const { el } = this;
    const pushEvent = this.pushEvent.bind(this);
    const pushEventTo = this.pushEventTo && this.pushEventTo.bind(this);
    const handleEvent = this.handleEvent && this.handleEvent.bind(this);
    const { target, componentClass } = await initLiveReactElement(this.el, { pushEvent, pushEventTo, handleEvent });
    const props = await render(el, target, componentClass, { pushEvent, pushEventTo, handleEvent });
    if (el.dataset.liveReactMerge) this.props = props
    Object.assign(this, { target, componentClass });
  },

  async updated() {
    const { el, target, componentClass } = this;
    const pushEvent = this.pushEvent.bind(this);
    const pushEventTo = this.pushEventTo && this.pushEventTo.bind(this);
    const handleEvent = this.handleEvent;
    const previousProps = this.props;

    const props = await render(el, target, componentClass, { pushEvent, pushEventTo }, previousProps);
    if (el.dataset.liveReactMerge) this.props = props
  },

  destroyed() {
    const { target } = this;
    ReactDOM.unmountComponentAtNode(target);
  }
}

export {
  LiveReact as default,
};
