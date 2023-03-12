import React from 'react';
import { Session, api_utils} from '../share';
import {Button, Form, Input, message, Tabs} from 'antd';
import { getStyles } from '../share/ts/themes';

const { TabPane } = Tabs;

type Props = {
    session: Session;
    onFinish: () => void;
};
export default class Profile extends React.Component<Props> {

    private onSignIn: (values: any) => Promise<void>;
    private onSignUp: (values: any) => void;
    private onFinishFailed: (values: any) => void;

    constructor(props: Props) {
        super(props);
        this.onSignUp = async (values: any) => {
            const exist = await api_utils.checkUsernameAvailability(values.username);
            if (exist.available) {
                api_utils.signup(values)
                  .then(() => {
                      message.success('注册成功, 正在自动登录...');
                      this.onSignIn(values).then(() => {
                          props.session.newFile('欢迎使用快笔记', []).then((docId) => {
                              localStorage.setItem('currentDocId', docId.toString());
                              this.props.onFinish();
                          });
                      });
                  }).catch(() => {
                    message.error('连接后端服务失败！');
                });
            } else {
                message.error('用户名已存在');
            }
        };

        this.onSignIn = async (values: any) => {
            const username = values.username;
            const exist = await api_utils.checkUsernameAvailability(username);
            if (exist.available) {
                message.error('用户名不存在');
            } else {
                values.usernameOrEmail = values.username;
                return api_utils.login(values)
                    .then(response => {
                        localStorage.setItem(api_utils.ACCESS_TOKEN, response.accessToken);
                        this.loadCurrentUser().then(() => {
                            message.success('登录成功!');
                            this.props.onFinish();
                            this.props.session.emit('updateAnyway');
                        });
                    }).catch(() => {
                        message.error('连接后端服务失败！');
                    });
            }
        };
        this.onFinishFailed = (errorInfo: any) => {
            console.log('Failed:', errorInfo);
        };
        this.state = {
            username: null
        };
    }

    private async loadCurrentUser() {
        api_utils.getCurrentUser().then(res => {
            this.props.session.currentUser = res;
        }).catch(() => {
            // do nothing
        });
    }
    public render() {
        return (
          <Tabs defaultActiveKey='1'>
              <TabPane tab='登录' key='1'>
                  <Form
                    name='basic'
                    onFocus={() => {
                        this.props.session.startKeyMonitor();
                    }}
                    onBlur={() => {
                        this.props.session.stopKeyMonitor('profile');
                    }}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 16 }}
                    layout='horizontal'
                    initialValues={{ remember: true }}
                    onFinish={this.onSignIn}
                    onFinishFailed={this.onFinishFailed}
                    autoComplete='off'
                  >
                      <Form.Item
                        label='用户名'
                        name='username'
                        rules={[{ required: true, message: '请输入用户名!' }]}
                      >
                          <Input />
                      </Form.Item>

                      <Form.Item
                        label='密码'
                        name='password'
                        rules={[{ required: true, message: '请输入密码!' }]}
                      >
                          <Input.Password />
                      </Form.Item>

                      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                          <Button type='primary' style={{
                              ...getStyles(this.props.session.clientStore, ['theme-bg-secondary', 'theme-trim', 'theme-text-primary'])
                          }} htmlType='submit'>
                              登陆
                          </Button>
                      </Form.Item>
                  </Form>
              </TabPane>
              <TabPane tab='注册' key='2'>
                  <Form
                    name='basic'
                    onFocus={() => {
                        this.props.session.stopKeyMonitor('profile');
                    }}
                    onBlur={() => {
                        this.props.session.startKeyMonitor();
                    }}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 16 }}
                    layout='horizontal'
                    initialValues={{ remember: true }}
                    onFinish={this.onSignUp}
                    onFinishFailed={this.onFinishFailed}
                    autoComplete='off'
                  >
                      <Form.Item
                        label='昵称'
                        name='name'
                        rules={[{ required: true, message: '请输入昵称!' }]}
                      >
                          <Input />
                      </Form.Item>
                      <Form.Item
                        label='用户名'
                        name='username'
                        rules={[{ required: true, message: '请输入用户名!' }]}
                      >
                          <Input />
                      </Form.Item>
                      <Form.Item
                        label='邮箱'
                        name='email'
                        rules={[{ required: true, message: '请输入邮箱!' }, { type: 'email', message: '请输入有效邮箱！'}]}
                      >
                          <Input />
                      </Form.Item>

                      <Form.Item
                        label='密码'
                        name='password'
                        rules={[{ required: true, message: '请输入密码!' }]}
                      >
                          <Input.Password />
                      </Form.Item>

                      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                          <Button type='primary' style={{
                              ...getStyles(this.props.session.clientStore, ['theme-bg-secondary', 'theme-trim', 'theme-text-primary'])
                          }} htmlType='submit'>
                              注册
                          </Button>
                      </Form.Item>
                  </Form>
              </TabPane>
          </Tabs>
        );
    }
}
