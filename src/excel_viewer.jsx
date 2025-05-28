import React, { useState } from "react";
import {
  Layout,
  Table,
  Button,
  Upload,
  Space,
  Card,
  Typography,
  Input,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const { Header, Content } = Layout;
const { Title } = Typography;

const ExcelViewer = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [searchText, setSearchText] = useState("");

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
          type: "array" 
        });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1 
        });

        const headers = jsonData[0]?.map((header, index) => ({
          title: header?.toString() || `Column ${index + 1}`,
          dataIndex: index.toString(),
          key: index.toString(),
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Search..."
                value={selectedKeys[0]}
                onChange={(e) => 
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => confirm()}
                style={{ width: 188, marginBottom: 8 }}
              />
            </div>
          ),
          filterIcon: (filtered) => (
            <SearchOutlined style={{ 
              color: filtered ? "#1890ff" : undefined 
            }} />
          ),
          onFilter: (value, record) =>
            record[index]?.toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
        })) || [];

        const tableData = jsonData.slice(1).map((row, rowIndex) => {
          const rowObj = { key: rowIndex.toString() };
          row.forEach((cell, cellIndex) => {
            rowObj[cellIndex.toString()] = cell;
          });
          return rowObj;
        });

        setColumns(headers);
        setData(tableData);
      } catch (error) {
        console.error("Error processing file:", error);
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleDownload = () => {
    if (data.length === 0) return;
    
    const wsData = data.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col.title] = row[col.dataIndex];
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "exported_data.xlsx");
  };

  const filteredData = data.filter(row =>
    columns.some(col =>
      row[col.dataIndex]?.toString()
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ 
        background: "#fff", 
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 1,
        width: "100%",
      }}>
        <Title level={4} style={{ margin: "16px 0" }}>
          Excel Viewer
        </Title>
      </Header>
      
      <Content style={{ 
        padding: "24px", 
        maxWidth: "100vw",
        overflow: "auto"
      }}>
        <Card
          title="Data Management"
          bordered={false}
          extra={
            <Space>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={handleFileUpload}
                showUploadList={false}
              >
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                >
                  Upload Excel
                </Button>
              </Upload>
              
              <Button 
                onClick={handleDownload}
                icon={<DownloadOutlined />}
                disabled={data.length === 0}
              >
                Export
              </Button>
            </Space>
          }
        >
          <Input
            placeholder="Search across all columns..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          
          <Table
            columns={columns}
            dataSource={filteredData}
            bordered
            scroll={{ 
              x: "max-content",
              y: "calc(100vh - 300px)" 
            }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
            }}
            size="middle"
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ExcelViewer;
