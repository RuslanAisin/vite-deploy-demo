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
import type { TableProps } from "antd";
type TableData = Record<string, any> & { key: string };
type TableColumn = {
  title: string;
  dataIndex: string;
  key: string;
  filterDropdown?: React.ReactNode;
  filterIcon?: React.ReactNode;
  onFilter?: (value: string, record: TableData) => boolean;
};

type ColumnTypes = Exclude<TableProps<TableColumn>["columns"], undefined>;
const ExcelViewer = () => {
  const [data, setData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [searchText, setSearchText] = useState("");

  const handleFileUpload: React.ComponentProps<
    typeof Upload
  >["beforeUpload"] = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
          type: "array",
        });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[][];
        // @ts-ignore
        const headers: TableColumn[] =
          jsonData[0]?.map((header, index) => ({
            title: header?.toString() || `Column ${index + 1}`,
            dataIndex: index.toString(),
            key: index.toString(),
            // @ts-ignore
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
              <div style={{ padding: 8 }}>
                <Input
                  placeholder="Поиск..."
                  value={selectedKeys[0]}
                  onChange={(e) =>
                    setSelectedKeys(e.target.value ? [e.target.value] : [])
                  }
                  onPressEnter={() => confirm()}
                  style={{ width: 188, marginBottom: 8 }}
                />
              </div>
            ),
            filterIcon: (filtered: boolean) => (
              <SearchOutlined
                style={{ color: filtered ? "#1890ff" : undefined }}
              />
            ),
            onFilter: (value: string, record: TableData) =>
              record[index]
                ?.toString()
                .toLowerCase()
                .includes(value.toLowerCase()),
          })) || [];

        const tableData = jsonData.slice(1).map((row, rowIndex) => {
          const rowObj: TableData = { key: rowIndex.toString() };
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
    return false; // Prevent default upload
  };

  const handleDownload = () => {
    if (data.length === 0) return;

    const wsData = data.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        obj[col.title] = row[col.dataIndex];
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "exported_data.xlsx");
  };

  const filteredData = data.filter((row) =>
    columns.some((col) =>
      row[col.dataIndex]
        ?.toString()
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
  );

  return (
    <Layout style={{ maxHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 24px" }}>
        <Title level={4} style={{ margin: "16px 0" }}>
          Excel Viewer
        </Title>
      </Header>

      <Content
        style={{
          padding: "24px",
          width: "2500px",
          margin: "0 auto",
          // maxHeight: "00px",
        }}
      >
        <Card
          title="Управление данными"
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Upload
                accept=".xlsx,.xls"
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
                Экспорт
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
            // @ts-ignore
            columns={columns as ColumnTypes}
            dataSource={filteredData}
            bordered
            scroll={{ x: "max-content", y: "auto" }}
            pagination={false}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ExcelViewer;
