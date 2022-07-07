import React, { Component } from 'react';

export class Mindmap extends Component {
  constructor(props) {
    super(props);
  }

  async setContent(content) {
    var _iframe = document.getElementById('leauiMindMapIfr').contentWindow;
    var km = _iframe.km;
    km.importJson(content);
  }

  async getContent() {
    var _iframe = document.getElementById('leauiMindMapIfr').contentWindow;
    var km = _iframe.km;
    const data = await km.exportData('png');
    const jsonData = await km.exportJson();
    console.log("当前内容" + JSON.stringify(jsonData));
    return {'img_src': data, 'json': jsonData};
  }
  render() {
    const iframe = '<iframe id="leauiMindMapIfr" src="./mindmap/index.html?i=1?'
      + new Date().getTime() + '" frameborder="0"'
      + ' width="' + (window.innerWidth - 70) + '"'
      + ' height="' + (window.innerHeight - 170) + '"></iframe>';
    return (
      <div dangerouslySetInnerHTML={{__html: iframe}} />
    );
  }
}
