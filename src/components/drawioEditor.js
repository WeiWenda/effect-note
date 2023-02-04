import React, { Component } from 'react';

export class DrawioEditor extends Component {
  constructor(props) {
    super(props);
    window.addEventListener('message', async function (evt) {
      if (evt.data.length < 1) {
        return
      }
      const msg = JSON.parse(evt.data)
      const { event } = msg
      if (event === 'init') {
        const defaultContent = '<mxfile host="localhost" modified="2022-12-28T12:32:59.984Z" agent="5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) yank.note/3.46.0 Chrome/94.0.4606.81 Electron/15.4.1 Safari/537.36" etag="7R9Kmf2VEIZBi9Ex0eIO" version="20.2.1" type="embed"><diagram id="inMPcjYvnmvmxzhDKLPN" name="Page-1">jZJNb4QgEIZ/DXeVZt1ea+3uYZsePPRMZCokIIbFVfvri2XwI6ZJL2Z4ZkbeeQdCCz1eLOvEu+GgSJbwkdBXkmXnc+6/M5gCyJOnABoreUDpCir5DQgTpL3kcN8VOmOUk90e1qZtoXY7xqw1w77sy6j9rR1r4ACqmqkj/ZTcCRwry1d+BdmIeHN6eg4ZzWIxTnIXjJthg2hJaGGNcSHSYwFq9i76Evre/sguwiy07j8NWWh4MNXjbNfydvtAcW6KE1vTtxzmpoTQl0FIB1XH6jk7+BV7JpxW/pT68CgCdT3AOhg3CEVdwGhwdvIlMRtXjS9kMWxY/U4jExuvT8gYrrhZfr264AM0Ih5Xw39zm1dLyx8=</diagram></mxfile>';
        const payload ={ action: 'load', autosave: 0 , xml: props.xml || defaultContent}
        var _iframe = document.getElementById('drawioIfr').contentWindow;
        _iframe.postMessage(JSON.stringify(payload), '*');
      } else if (event === 'save') {
        props.onFinish();
        props.session.drawioOnSave(msg.xml)
      } else if (event === 'exit') {
        props.onFinish();
      }
    }
  )}

  render() {
    const iframe = '<iframe id="drawioIfr" src="/drawio/index.html?embed=1&proto=json"'
      + ' frameborder="0"'
      + ' width="' + (window.innerWidth - 70) + '"'
      + ' height="' + (window.innerHeight - 125) + '"></iframe>';
    return (
      <div dangerouslySetInnerHTML={{__html: iframe}} />
    );
  }
}
