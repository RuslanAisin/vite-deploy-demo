import React, { useState } from 'react';
import { Layout, Table, Button, Upload, Space, Card, Typography, Input } from 'antd';
import { UploadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Header, Content } = Layout;
const { Title } = Typography;

const ExcelViewer = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Обработка загрузки файла
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = jsonData[0]?.map((header, index) => ({
        title: header || `Column ${index + 1}`,
        dataIndex: index.toString(),
        key: index.toString(),
        filterDropdown: ({ setSelectedKeys, selectedKeys }) => (
          <Input
            placeholder="Поиск..."
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {}}
            style={{ width: 180 }}
          />
        ),
        filterIcon: () => <SearchOutlined />,
        onFilter: (value, record) => 
          record[index]?.toString().toLowerCase().includes(value.toLowerCase()),
      })) || [];

      const tableData = jsonData.slice(1).map((row, rowIndex) => {
        const rowObj = { key: rowIndex };
        row.forEach((cell, cellIndex) => {
          rowObj[cellIndex] = cell;
        });
        return rowObj;
      });

      setColumns(headers);
      setData(tableData);
    };
    reader.readAsArrayBuffer(file);
    return false; // Отменяем автоматическую загрузку
  };

  // Скачивание данных обратно в Excel
  const handleDownload = () => {
    if (data.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(data.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col.title] = row[col.dataIndex];
      });
      return obj;
    }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "exported_data.xlsx");
  };

  // Фильтрация данных
  const filteredData = data.filter(row =>
    columns.some(col =>
      row[col.dataIndex]?.toString().toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <Title level={4} style={{ margin: '16px 0' }}>Excel Viewer</Title>
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Card
          title="Управление данными"
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Upload
                accept=".xlsx, .xls"
                beforeUpload={handleFileUpload}
                showUploadList={false}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  Загрузить Excel
                </Button>
              </Upload>
              
              <Button 
                onClick={handleDownload} 
                icon={<DownloadOutlined />}
                disabled={data.length === 0}
              >
                Экспорт в Excel
              </Button>
            </Space>
          }
        >
          <Input
            placeholder="Поиск по всем столбцам..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          
          <Table
            columns={columns}
            dataSource={filteredData}
            bordered
            scroll={{ x: true }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Всего: ${total}`,
            }}
            style={{ overflowX: 'auto' }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ExcelViewer;
