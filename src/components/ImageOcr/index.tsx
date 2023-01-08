import React, {BaseSyntheticEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Divider, Image, message, Popconfirm, Tooltip, Upload, Form, Input, Select, Button} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  FrownOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import './index.sass';
import {RcFile} from 'antd/es/upload';
import {UploadFile} from 'antd/es/upload/interface';
import classNames from 'classnames';
import 'tui-image-editor/dist/tui-image-editor.min.css';
import {creatImageUid, ImageEditComp} from './ImageEditor';
import {usePasteImage} from '../../ts/pasteImage';
import {imageToFile} from '../../ts/file';
import {ocrFile} from '../../share/ts/utils/APIUtils';
import {Session} from '../../share';
const { TextArea } = Input;

const Dragger = Upload.Dragger!;
const stopPropagation = (ev: BaseSyntheticEvent) => {
  ev.stopPropagation();
};

export interface UploadImageInfo {
  uploadFile?: UploadFile;
  blobURL?: string;
}

export const ImageOcr = (props: {session: Session}) => {

  const [values, valueChange] = useState<UploadImageInfo[]>([]);
  const [form] = Form.useForm();
  const reUpload = async (idx: number, list: UploadImageInfo[]) => {
    const listTmp = [...list];
    const item = listTmp[idx];
    const file = item.uploadFile!;
    // let loadingKey = Date.now();
    try {
      item.uploadFile = {...file, status: 'uploading'};
      valueChange(listTmp);
      // message.loading({content: '文字识别中...', duration: 0, key: loadingKey});
      const res = await ocrFile(file?.originFileObj!).catch(e => {
        props.session.showMessage(e, {warning: true});
      });
      form.setFields([
        {name: 'text', value: form.getFieldValue('text').value ?? '' + res.content.replace(/[ \t\r\f\v]/g, '')}
      ]);
      // message.destroy(loadingKey);
      item.uploadFile = {...file, status: 'success'};
    } catch (e) {
      // message.destroy(loadingKey);
      item.uploadFile = {...file, status: 'error'};
    }
    valueChange([...listTmp]);
  };

  const [uploadingImgs, setUploadingImgs] = useState<UploadFile[]>(values.map(i => i.uploadFile!) || []);
  const onPaste = async (image: HTMLImageElement) => {
    const file = await imageToFile(image) as RcFile;
    file.uid = creatImageUid();
    const imageInfo: UploadImageInfo = {
      blobURL: image.src,
      uploadFile: {
        uid: file.uid,
        name: 'paste.png',
        status: 'success',
        originFileObj: file,
      }
    };
    values.push(imageInfo);
    valueChange([...values]);
  };
  usePasteImage(onPaste);
  useEffect(() => {
    if (values === undefined) {
      return;
    }
    setUploadingImgs(values.map(i => i.uploadFile!) || []);
  }, [values]);
  const ref = useRef(null);

  const onDelete = (i: number) => {
    values.splice(i, 1);
    valueChange([...values]);
  };
  const clickAdd = useCallback(() => {
    const parent = ref.current! as HTMLDivElement;
    parent.querySelector('input[type=file]')!.dispatchEvent(new MouseEvent('click'));
  }, []);
  const onChange = (ev: any) => {
    const fileList = [...(ev.fileList as UploadFile[])];
    const originList = values.map(item => {
      if (item.uploadFile) {
        for (let i = 0; i < fileList.length; i++) {
          if (fileList[i].uid === item.uploadFile.uid) {
            item.uploadFile = fileList[i];
            fileList.splice(i, 1);
            break;
          }
        }
      }
      return {...item};
    });
    const newFiles = fileList.map(item => ({
      uploadFile: {...item, status: 'done'},
      blobURL: URL.createObjectURL(item.originFileObj as Blob)
    } as UploadImageInfo));
    valueChange(originList.concat(newFiles));
  };
  const [visible, setVisible] = useState(false);
  const onVisibleChange = useMemo(() => {
    let t: any;
    return (v: boolean) => {
      clearTimeout(t);
      if (v) {
        t = setTimeout(() => setVisible(true), 200);
      } else {
        setVisible(false);
      }
    };
  }, []);

  const onCancel = () => {
    setVisible(false);
    closeImagePreview();
  };
  const onOk = (_current: UploadImageInfo, images: UploadImageInfo[]) => {
    valueChange(images);
    closeImagePreview();
  };

  return (<div className='app-image-upload' ref={ref}>
    <Dragger
      customRequest={() => {}}
      multiple
      fileList={uploadingImgs}
      showUploadList={false} onChange={onChange}>
      <div className='picture-list' onClick={stopPropagation}>
        <Image.PreviewGroup preview={{onVisibleChange}}>
          <ImageEditComp images={values} buttonVisible={visible} onCancel={onCancel} onOk={onOk}/>
          {values.map((item, i) => (
            <div className={classNames('picture-item', item.uploadFile?.status === 'error' && 'error')}
                 key={item.blobURL}>
              <div className='picture-item-mask error' onClick={(ev) => {
                stopPropagation(ev!);
                onDelete(i);
              }}>
                <div className='pr-mask'>
                  <DeleteOutlined className='btn'/>
                </div>
              </div>
              <Image
                onError={(ev) => {
                  // @ts-ignore
                  ev.target.parentElement.parentElement.classList.add('error-img');
                }}
                preview={{
                  src: item.blobURL,
                  mask:
                    <div className='pr-mask'>
                      <EyeOutlined className='btn'/>
                      <Divider type='vertical' style={{borderColor: '#fff'}}/>
                      <Popconfirm
                        title='确认删除吗?'
                        onConfirm={(ev) => {
                          stopPropagation(ev!);
                          onDelete(i);
                        }}
                        onCancel={(ev) => stopPropagation(ev!)}
                      >
                        <DeleteOutlined onClick={stopPropagation} className='btn'/>
                      </Popconfirm>
                    </div>
                }}
                src={item.blobURL}/>
              {item.uploadFile?.status === 'uploading'
                && (<div className='picture-item-mask uploading'><LoadingOutlined/><span>识别中</span></div>)}
              {item.uploadFile?.status === 'error'
                && (<div className='picture-item-mask'><FrownOutlined/><span>上传失败</span></div>)}
            </div>
          ))}
        </Image.PreviewGroup>
        <Tooltip title='点击、拖拽或者粘贴(ctrl + v)图片'>
            <div className='picture-item' key='-1' onClick={clickAdd}>
                <PlusOutlined/>
            </div>
        </Tooltip>
      </div>
    </Dragger>
    <Button
      style={{marginTop: '10px', marginBottom: '10px', float: 'right'}}
      onClick={() => {
      values.reduce((p: Promise<void>, _currentValue: UploadImageInfo, index: number) => {
        return p.then(() => reUpload(index, values));
      }, Promise.resolve());
    }}>开始识别</Button>
    <Divider />
    <Form
      layout='vertical'
      form={form}
      initialValues={{text: ''}}
      onFinish={(formValues) => {
        props.session.pasteText(formValues.text).then(() => {
          props.session.showMessage('插入成功');
          props.session.ocrModalVisible = false;
          props.session.emit('updateAnyway');
        });
      }}
    >
      <Form.Item name='text' label=''>
        <TextArea placeholder={'暂无识别结果'} rows={4} />
      </Form.Item>
      <Form.Item>
        <div style={{display: 'flex', justifyContent: 'end'}}>
          <Button htmlType='submit'>插入</Button>
        </div>
      </Form.Item>
    </Form>
  </div>);
};

function closeImagePreview() {
  try {
    // @ts-ignore;
    document.querySelector('.ant-image-preview-operations-operation-close')?.click();
  } catch (e) {
    console.error(e);
  }
}
