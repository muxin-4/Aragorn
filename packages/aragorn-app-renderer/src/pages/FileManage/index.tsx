import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { clipboard, ipcRenderer, shell } from 'electron';
import { Select, Table, message, Space, Button, Breadcrumb, Modal, Form, Input, Divider, Popover, Image } from 'antd';
import {
  FileOutlined,
  FolderFilled,
  DeleteOutlined,
  DownloadOutlined,
  CopyOutlined,
  ReloadOutlined,
  FolderAddOutlined,
  UploadOutlined,
  ExportOutlined
} from '@ant-design/icons';
import filesize from 'filesize';
import dayjs from 'dayjs';
import { useAppContext } from '@renderer/context/app';
import { domainPathRegExp } from '@renderer/utils/validationRule';
import { UploaderProfile } from '@main/uploaderProfileManager';
import { ListFile, FileListResponse, DeleteFileResponse, CreateDirectoryResponse } from 'aragorn-types';
import { ColumnsType } from 'antd/lib/table/interface';

export const FileManage = () => {
  const {
    state: {
      uploaderProfiles,
      configuration: { defaultUploaderProfileId }
    }
  } = useAppContext();

  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    function handleResize() {
      setWindowHeight(window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { id } = useParams<{ id: string }>();

  const [hasFileManageFeature, setHasFileManageFeature] = useState(false);

  const [uploaderProfile, setUploaderProfile] = useState({} as UploaderProfile);

  useEffect(() => {
    const currentId = id || defaultUploaderProfileId;
    setCurrentProfile(currentId as string);
  }, []);

  useEffect(() => {
    if (uploaderProfile?.id) {
      getList();
    }
  }, [uploaderProfile]);

  const [list, setList] = useState([] as ListFile[]);
  const [listLoading, setListLoading] = useState(false);

  const getList = (directoryPath?: string) => {
    setListLoading(true);
    ipcRenderer.send('file-list-get', uploaderProfile.id, directoryPath);
  };

  const [dirPath, setDirPath] = useState([] as string[]);

  useEffect(() => {
    function handleListGetReply(_, res?: FileListResponse) {
      setListLoading(false);
      if (res === undefined) {
        setHasFileManageFeature(false);
        setList([]);
        message.info(`${uploaderProfile.uploaderName}??????????????????????????????`);
        return;
      }
      setHasFileManageFeature(true);
      if (res.success) {
        setList(res.data);
      } else {
        message.error(`???????????????????????? ${res.desc || ''}`);
      }
    }

    function handleFileDeleteReply(_, res?: DeleteFileResponse) {
      if (res === undefined) {
        return;
      }
      if (res.success) {
        message.success({ content: '??????????????????', key: 'file-manage-delete' });
        getList(dirPath.join('/'));
      } else {
        message.error({ content: `?????????????????? ${res.desc || ''}`, key: 'file-manage-delete' });
      }
    }

    function handleFileUploadReply() {
      getList(dirPath.join('/'));
    }

    function handleDirectoryCreateReply(_, res?: CreateDirectoryResponse) {
      if (res === undefined) {
        return;
      }
      if (res.success) {
        message.success('??????????????????');
        setModalVisible(false);
        getList(dirPath.join('/'));
      } else {
        message.error(`?????????????????? ${res.desc || ''}`);
      }
    }

    function handleExportReplay(_, res) {
      setExportLoading(false);
      if (res) {
        shell.showItemInFolder(res);
        setRowKeys([]);
        setSelectRows([]);
      }
    }

    ipcRenderer.on('file-list-get-reply', handleListGetReply);
    ipcRenderer.on('file-delete-reply', handleFileDeleteReply);
    ipcRenderer.on('file-upload-reply', handleFileUploadReply);
    ipcRenderer.on('directory-create-reply', handleDirectoryCreateReply);
    ipcRenderer.on('export-reply', handleExportReplay);

    return () => {
      ipcRenderer.removeListener('file-list-get-reply', handleListGetReply);
      ipcRenderer.removeListener('file-delete-reply', handleFileDeleteReply);
      ipcRenderer.removeListener('file-upload-reply', handleFileUploadReply);
      ipcRenderer.removeListener('directory-create-reply', handleDirectoryCreateReply);
      ipcRenderer.removeListener('export-reply', handleExportReplay);
    };
  }, [uploaderProfile, dirPath]);

  const handleNameClick = (record: ListFile) => {
    if (record.type === 'directory') {
      const newPath = [...dirPath, formatFileName(record.name)];
      setDirPath(newPath);
      getList(newPath.join('/'));
    } else {
      clipboard.writeText(record.url as string);
      message.success('???????????????????????????');
    }
  };

  const handlePathClick = (index: number) => {
    if (index === -1) {
      setDirPath([]);
      getList();
    } else {
      const newPath = dirPath.slice(0, index + 1);
      setDirPath(newPath);
      getList(newPath.join('/'));
    }
  };

  const setCurrentProfile = (uploaderProfileId: string) => {
    setDirPath([]);
    const uploaderProfile = uploaderProfiles.find(item => item.id === uploaderProfileId);
    setUploaderProfile(uploaderProfile as UploaderProfile);
  };

  const formatFileName = (name: string) => {
    if (dirPath.length > 0) {
      const pathPrefix = dirPath.join('/') + '/';
      return name.split(pathPrefix).pop() || '';
    } else {
      return name;
    }
  };

  const [selectRowKeys, setRowKeys] = useState([] as string[]);
  const [selectRows, setSelectRows] = useState([] as ListFile[]);

  const handleTableRowChange = (selectedRowKeys, selectedRows: ListFile[]) => {
    setRowKeys(selectedRowKeys);
    setSelectRows(selectedRows);
  };

  const handleRefresh = () => {
    getList(dirPath.join('/'));
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '????????????',
      onOk: () => {
        const names = selectRows.map(item => [...dirPath, formatFileName(item.name)].join('/'));
        message.info({ content: '????????????????????????...', key: 'file-manage-delete' });
        ipcRenderer.send('file-delete', uploaderProfile.id, names);
      }
    });
  };

  const handleDelete = (record: ListFile) => {
    let name = record.name;
    Modal.confirm({
      title: '????????????',
      content: name,
      onOk: () => {
        let name = record.name;
        if (record.type === 'directory') {
          name = `${[...dirPath, record.name].join('/')}/`;
        } else {
          name = [...dirPath, formatFileName(record.name)].join('/');
        }
        message.info({ content: '????????????????????????...', key: 'file-manage-delete' });
        ipcRenderer.send('file-delete', uploaderProfile.id, [name]);
      }
    });
  };

  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.FormEvent<HTMLInputElement>) => {
    const fileList = event.currentTarget.files || [];
    const filesPath = Array.from(fileList).map(file => file.path);
    const pathPrefix = dirPath.join('/');
    ipcRenderer.send('file-upload', uploaderProfile.id, filesPath, pathPrefix);
    event.currentTarget.value = '';
  };

  const [modalVisible, setModalVisible] = useState(false);

  const [form] = Form.useForm();

  const handleCreateDirectory = () => {
    form.validateFields().then(values => {
      ipcRenderer.send('directory-create', uploaderProfile.id, values?.directoryPath || '');
    });
  };

  const handleDownload = (record: ListFile) => {
    ipcRenderer.send('file-download', record.name, record.url);
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = () => {
    const data = selectRows.map(item => {
      const fileNameArr = item.name.split('.');
      fileNameArr.pop();
      return {
        name: fileNameArr.join('.'),
        url: item.url
      };
    });
    setExportLoading(true);
    ipcRenderer.send('export', data);
  };

  const columns: ColumnsType<ListFile> = [
    {
      title: '?????????',
      dataIndex: 'name',
      ellipsis: true,
      render: (val: string, record: ListFile) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.type === 'directory' ? (
            <FolderFilled style={{ fontSize: 16 }} />
          ) : (
            <FileOutlined style={{ fontSize: 16 }} />
          )}
          {record.type === 'directory' ? (
            <a
              title={val}
              onClick={() => handleNameClick(record)}
              className="table-filename"
              style={{ marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {formatFileName(val)}
            </a>
          ) : (
            <Popover
              placement="topLeft"
              content={() =>
                /(jpg|png|gif|jpeg)$/.test(val) ? (
                  <Image
                    style={{ maxWidth: 500 }}
                    src={record.url}
                    fallback="data:image/png;base64,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"
                  />
                ) : (
                  val
                )
              }
              trigger="hover"
            >
              <a
                title={val}
                onClick={() => handleNameClick(record)}
                className="table-filename"
                style={{ marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {formatFileName(val)}
              </a>
            </Popover>
          )}
        </div>
      )
    },
    {
      title: '????????????',
      dataIndex: 'size',
      ellipsis: true,
      width: 120,
      render: val => (val ? filesize(val) : '-')
    },
    {
      title: '????????????',
      dataIndex: 'lastModified',
      ellipsis: true,
      width: 200,
      render: val => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-')
    },
    {
      title: '??????',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.type !== 'directory' && (
            <>
              <DownloadOutlined onClick={() => handleDownload(record)} />
              <CopyOutlined onClick={() => handleNameClick(record)} />
            </>
          )}
          <DeleteOutlined onClick={() => handleDelete(record)} />
        </Space>
      )
    }
  ];

  return (
    <div className="storage-page">
      <header>
        <span>????????????</span>
        <Divider />
      </header>
      <Space style={{ marginBottom: 10 }}>
        <Select style={{ minWidth: 120 }} value={uploaderProfile?.id} onChange={setCurrentProfile}>
          {uploaderProfiles.map(item => (
            <Select.Option key={item.name} value={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
        <Button
          title="??????"
          icon={<UploadOutlined />}
          disabled={!hasFileManageFeature}
          type="primary"
          onClick={() => {
            uploadRef.current?.click();
          }}
        />
        <Button title="??????" icon={<ReloadOutlined />} disabled={!hasFileManageFeature} onClick={handleRefresh} />
        <Button
          title="???????????????"
          icon={<FolderAddOutlined />}
          disabled={!hasFileManageFeature}
          onClick={() => {
            setModalVisible(true);
          }}
        />
        <Button
          title="??????"
          icon={<ExportOutlined />}
          disabled={selectRows.length === 0}
          onClick={handleExport}
          loading={exportLoading}
        />
        <Button title="??????" icon={<DeleteOutlined />} disabled={selectRows.length === 0} onClick={handleBatchDelete} />
      </Space>
      <Breadcrumb style={{ marginBottom: 10 }}>
        <Breadcrumb.Item>
          <a onClick={() => handlePathClick(-1)}>????????????</a>
        </Breadcrumb.Item>
        {dirPath.map((item, index) => (
          <Breadcrumb.Item key={item}>
            <a onClick={() => handlePathClick(index)}>{item}</a>
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
      <div className="table-wrapper">
        <Table
          size="small"
          rowKey="name"
          scroll={{ y: windowHeight - 270 }}
          dataSource={list}
          columns={columns}
          pagination={{
            size: 'small',
            defaultPageSize: 100,
            pageSizeOptions: ['50', '100', '200'],
            hideOnSinglePage: true
          }}
          loading={listLoading}
          rowSelection={{
            onChange: handleTableRowChange,
            selectedRowKeys: selectRowKeys,
            getCheckboxProps: record => ({ disabled: record?.type === 'directory' })
          }}
        />
      </div>
      <input ref={uploadRef} type="file" multiple hidden onChange={handleFileUpload} />
      <Modal
        title="????????????"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCreateDirectory}
        destroyOnClose={true}
      >
        <Form form={form} preserve={false}>
          <Form.Item
            label="????????????"
            name="directoryPath"
            rules={[{ required: true }, { pattern: domainPathRegExp, message: '?????????????????? / ???????????????' }]}
          >
            <Input autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
