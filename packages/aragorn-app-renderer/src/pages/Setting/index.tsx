/* eslint-disable no-template-curly-in-string */
import React, { useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Row, Col, Form, Input, InputNumber, Button, Select, Radio, Switch, message, Space, Divider } from 'antd';
import { useAppContext } from '@renderer/context/app';
import { usePlatform } from '@renderer/hook/usePlatform';
import { domainPathValidationRule } from '@renderer/utils/validationRule';

const inputItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 15 }
};
const switchtemLayout = {
  labelCol: { span: 13 },
  wrapperCol: { span: 11 }
};

export const Setting = () => {
  const {
    state: { configuration, uploaderProfiles }
  } = useAppContext();

  const platform = usePlatform();

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(configuration);
  }, [configuration]);

  useEffect(() => {
    function handleWorkflowCopyReply(_, res) {
      if (res) {
        message.success('右键菜单添加成功');
      } else {
        message.error('右键菜单添加失败');
      }
    }

    function handleInstallCliReply(_, res) {
      if (res) {
        message.success('CLI 安装成功');
      } else {
        message.error('CLI 安装失败');
      }
    }

    function handleToggleWebServerReply(_, res: { toggle: boolean; success: boolean; message?: string }) {
      if (res.success) {
        message.success(res.toggle ? 'WebServer 开启成功' : 'WebServer 关闭成功');
      } else {
        message.error(res.toggle ? `WebServer 开启失败${message || ''}` : 'WebServer 关闭失败');
      }
    }

    function handleToggleUploadShortcutKeyReply(_, res: { toggle: boolean; success: boolean }) {
      if (res.success) {
        message.success(res.toggle ? '上传快捷键设置成功' : '上传快捷键关闭成功');
      } else {
        message.error(res.toggle ? '上传快捷键设置失败' : '上传快捷键关闭失败');
      }
    }

    ipcRenderer.on('copy-darwin-workflow-reply', handleWorkflowCopyReply);
    ipcRenderer.on('install-cli-reply', handleInstallCliReply);
    ipcRenderer.on('toggle-webserver-reply', handleToggleWebServerReply);
    ipcRenderer.on('toggle-upload-shortcut-key-reply', handleToggleUploadShortcutKeyReply);
    return () => {
      ipcRenderer.removeListener('copy-darwin-workflow-reply', handleWorkflowCopyReply);
      ipcRenderer.removeListener('install-cli-reply', handleInstallCliReply);
      ipcRenderer.removeListener('toggle-webserver-reply', handleToggleWebServerReply);
      ipcRenderer.removeListener('toggle-upload-shortcut-key-reply', handleToggleUploadShortcutKeyReply);
    };
  }, []);

  const handleSubmit = () => {
    form.submit();
  };

  const handleReset = () => {
    form.resetFields();
  };

  const handleFinish = values => {
    console.log(values);
    ipcRenderer.send('setting-configuration-update', values);
  };

  /**
   * Shortcut key recording only contains modifier key numbers and letters
   */
  const handleShortcutKeyRecord = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.persist();
    event.preventDefault();

    const { shiftKey, ctrlKey, altKey, metaKey, keyCode } = event;

    const res = [] as string[];

    if (metaKey) {
      res.push(process.platform === 'darwin' ? 'Command' : 'Super');
    }

    if (shiftKey) {
      res.push('Shift');
    }

    if (ctrlKey) {
      res.push('Control');
    }

    if (altKey) {
      res.push('Alt');
    }

    const modifierKeyCodeArr = [91, 93, 18, 17, 16];

    if (!modifierKeyCodeArr.includes(keyCode)) {
      const keyName = String.fromCharCode(keyCode).toUpperCase();
      if (/^[0-9A-Z]$/.test(keyName)) {
        res.push(keyName);
      }
    }

    if (res.length > 0) {
      form.setFieldsValue({ uploadShortcutKey: res.join('+') });
    }
  };

  const handleToggleWebServer = () => {
    const webServerPort = form.getFieldValue('webServerPort');
    if (webServerPort) {
      ipcRenderer.send('toggle-webserver', webServerPort);
    } else {
      console.error('webServerPort is not exists');
    }
  };

  const handleToggleUploadShortcutKey = () => {
    const uploadShortcutKey = form.getFieldValue('uploadShortcutKey');
    if (uploadShortcutKey) {
      ipcRenderer.send('toggle-upload-shortcut-key', uploadShortcutKey);
    } else {
      console.error('upload shortcut key is not exists');
    }
  };

  const handleAddWorkflow = () => {
    ipcRenderer.send('copy-darwin-workflow');
  };

  const handleInstallCli = () => {
    ipcRenderer.send('install-cli');
  };

  const handleOpenLog = () => {
    ipcRenderer.send('open-log');
  };

  return (
    <div className="setting-wrapper">
      <header>
        <span>设置</span>
        <Divider />
      </header>
      <main>
        <Form
          {...switchtemLayout}
          layout="horizontal"
          labelAlign="left"
          form={form}
          initialValues={configuration}
          onFinish={handleFinish}
        >
          <Row>
            <Col xs={24}>
              <Form.Item name="urlType" label="链接格式" {...inputItemLayout}>
                <Radio.Group>
                  <Radio.Button value="URL">URL</Radio.Button>
                  <Radio.Button value="HTML">HTML</Radio.Button>
                  <Radio.Button value="Markdown">Markdown</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24}>
              <Form.Item name="defaultUploaderProfileId" label="默认上传器配置" {...inputItemLayout}>
                <Select>
                  {uploaderProfiles.map(item => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24}>
              <Form.Item name="proxy" label="设置代理" {...inputItemLayout}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Form.Item name="autoCopy" label="自动复制" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="autoRecover" label="自动恢复粘贴板内容" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Form.Item name="rename" label="重命名文件" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="renameFormat"
                wrapperCol={{ span: 18 }}
                rules={[domainPathValidationRule]}
                extra="魔法变量: {fileName} {fileExtName} {uuid:n} {year} {month} {day} {hour} {minute} {second}"
              >
                <Input placeholder="请输入文件命名格式" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Form.Item name="showNotifaction" label="系统通知提示" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="sound" label="提示音" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Form.Item name="autoStart" label="开机自启" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Form.Item name="autoUpdate" label="自动检查更新" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="useBetaVersion" label="接收beta版本更新" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24}>
              <Form.Item label="WebServer" {...inputItemLayout} wrapperCol={{ span: 8 }}>
                <Row gutter={8}>
                  <Col xs={18}>
                    <Form.Item name="webServerPort">
                      <InputNumber
                        style={{ width: '100%' }}
                        min={3001}
                        max={65535}
                        disabled={configuration.openWebServer}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={6}>
                    <Form.Item name="openWebServer" valuePropName="checked" hidden>
                      <Switch />
                    </Form.Item>
                    <Button onClick={handleToggleWebServer}>{configuration.openWebServer ? '关闭' : '开启'}</Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24}>
              <Form.Item label="上传快捷键" {...inputItemLayout} wrapperCol={{ span: 8 }}>
                <Row gutter={8}>
                  <Col xs={18}>
                    <Form.Item name="uploadShortcutKey">
                      <Input onKeyDown={handleShortcutKeyRecord} disabled={configuration.openUploadShortcutKey} />
                    </Form.Item>
                  </Col>
                  <Col xs={6}>
                    <Form.Item name="openUploadShortcutKey" valuePropName="checked" hidden>
                      <Switch />
                    </Form.Item>
                    <Button onClick={handleToggleUploadShortcutKey}>
                      {configuration.openUploadShortcutKey ? '关闭' : '开启'}
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </main>
      <footer>
        <Divider />
        <Space>
          <Button type="primary" onClick={handleSubmit}>
            保存并应用
          </Button>
          <Button onClick={handleReset}>放弃</Button>
          {platform === 'darwin' && (
            <>
              <Button onClick={handleInstallCli}>安装 CLI</Button>
              <Button onClick={handleAddWorkflow}>添加右键菜单</Button>
            </>
          )}
          <Button onClick={handleOpenLog}>打开日志</Button>
        </Space>
      </footer>
    </div>
  );
};
