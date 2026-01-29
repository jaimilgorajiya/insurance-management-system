import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.csv`);
};

export const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, headers, title, filename) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    
    // Convert data object to array of arrays based on headers
    // headers = [{header: 'Name', key: 'name'}, ...]
    const tableData = data.map(row => headers.map(h => row[h.key]));
    const columns = headers.map(h => h.header);

    autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 20,
    });
    
    doc.save(`${filename}.pdf`);
};
