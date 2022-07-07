import React, { Component } from 'react';

export class DrawioViewer extends Component {
  constructor(props) {
    super(props)
    window.addEventListener('message', async function (evt) {
      if (evt.data.length < 1) {
        return
      }
      const msg = JSON.parse(evt.data)
      const { action, row } = msg
      if (action === 'iframe-click') {
        props.onClickFunc(row);
      }
    })
  }
  render() {
    const div = document.createElement('div')
    div.className = 'mxgraph'
    div.dataset.mxgraph = JSON.stringify({
      highlight: this.props.session.clientStore.getClientSetting('theme-bg-highlight'),
      lightbox: false,
      nav: true,
      resize: true,
      toolbar: 'pages zoom layers',
      page: 0, // page start from 0
      xml: this.props.content,
    })
    const iframeContent =
        `<body>
          ${div.outerHTML.replaceAll(/"/g, '\'')}
          <script type='text/javascript' src='drawio/js/viewer-static.min.js'></script>
        </body>`
    const iframe = '<iframe id="drawioViewIfr" onload="resizeIframe(this,' + this.props.row + ')" class="drawio-viewer" srcDoc="' + iframeContent + '"'
      + ' frameborder="0" ></iframe>';
    return (
      <div dangerouslySetInnerHTML={{__html: iframe}} />
    );
  }
}
