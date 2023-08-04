import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Button, Space, Spin} from 'antd';
import usePortal from 'react-cool-portal';
import ImageEditor from 'tui-image-editor';
import {base64toFile, loadFileFromUrl} from '../../ts/file';
import {FormOutlined} from '@ant-design/icons';
import {UploadImageInfo} from './index';
import {RcFile} from 'antd/es/upload';
// import {context} from 'rc-image/es/PreviewGroup';

export interface ImageEditCompProps {
  buttonVisible?: boolean;
  onCancel?: () => void;
  onOk?: (current: UploadImageInfo, images: UploadImageInfo[]) => void;
  images: UploadImageInfo[];
}

function createImageEditor(dom: any) {
  return new ImageEditor(dom, {
    includeUI: {
      uiSize: {
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px',
      },
      initMenu: 'shape'
    },
    usageStatistics: false,
    selectionStyle: {
      cornerSize: 10,
      rotatingPointOffset: 70,
    },
  });
}

let id = 0;

export function ImageEditComp(props: ImageEditCompProps) {
  const {Portal, show, hide} = usePortal({defaultShow: false, escToHide: false, clickOutsideToHide: false});
  const [editorVisible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const current = useCurrentImageUrl();
  const editorDivRef = useRef(null);

  const editorRef = useRef<ImageEditor>();
  const showEditor = useCallback(async () => {
    if (!editorRef.current) {
      editorRef.current = createImageEditor(editorDivRef.current);
    }
    try {
      setVisible(true);
      (editorDivRef.current! as HTMLDivElement).style.pointerEvents = 'initial';
      const currentImageInfo = props.images.find(i => i.blobURL === current);
      if (currentImageInfo) {
        try {
          await editorRef.current.loadImageFromFile(currentImageInfo.uploadFile!.originFileObj as File);
          setLoading(false);
          // @ts-ignore;
          editorRef.current.ui.activeMenuEvent();
        } catch (e) {
          setLoading(false);
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [props.images, current]);
  useEffect(() => {
    if (props.buttonVisible) {
      show();
    } else {
      hide();
      editorRef.current?.destroy();
      editorRef.current = undefined;
    }
  }, [props.buttonVisible]);



  useEffect(() => {
    const onWindowResize = () => {
      editorRef.current?.ui.resizeEditor({
        uiSize: {
          width: window.innerWidth + 'px',
          height: window.innerHeight + 'px'
        }
      });
    };
    window.addEventListener('resize', onWindowResize);
    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, []);

  const onCancel = () => {
    editorRef.current?.destroy();
    editorRef.current = undefined;
    setVisible(false);
    props.onCancel?.();
  };
  const onSave = async () => {
    const url = editorRef.current?.toDataURL({format: 'image/png'});
    if (url) {
      const file = base64toFile(url, 'xx.png');
      const urlP = URL.createObjectURL(file);
      editorRef.current?.destroy();
      editorRef.current = undefined;
      setVisible(false);
      const idx = props.images.findIndex(i => i.blobURL === current);
      const currentImageInfo = props.images[idx];
      const uid = currentImageInfo!.uploadFile?.uid || creatImageUid();

      const images = [...props.images];
      images[idx] = {
        ...currentImageInfo!,
        blobURL: urlP,
        uploadFile: {
          uid: uid,
          fileName: currentImageInfo!.uploadFile?.fileName,
          name: currentImageInfo?.uploadFile?.name || 'IMAGE_EDITOR_IMG',
          originFileObj: file as RcFile
        }
      };
      // @ts-ignore;
      file.uid = uid;
      props.onOk?.(images[idx], images);
    }
  };
  return (<Portal>
    <div className='editor-visible-button'>
      <Button type='text' onClick={() => showEditor()} icon={<FormOutlined/>}/>
    </div>
    <div className='image-editor'>
      {/*<Spin spinning={loading}>*/}
      {/*  <div ref={editorDivRef}/>*/}
      {/*</Spin>*/}
    </div>
    {editorVisible && (
      <div className='image-editor-button flex-e m-r-10_c'>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type='primary' onClick={onSave}>保存</Button>
        </Space>
      </div>
    )}
  </Portal>);
}

function useCurrentImageUrl(): string {
  // @ts-ignore
  const previewContext = useContext(context) as any;
  return previewContext.previewUrls.get(previewContext.current)!;
}

export function creatImageUid() {
  return 'IMAGE_EDITOR_' + id++;
}
