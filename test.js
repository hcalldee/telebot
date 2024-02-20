const puppeteer = require('puppeteer');
const fs = require('fs');

async function generateImage(htmlContent, outputFilePath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content of the page to the provided HTML
    await page.setContent(htmlContent);

    // You might need to adjust the viewport size based on your table size
    await page.setViewport({
        width: 800,
        height: 600,
        deviceScaleFactor: 1,
    });

    // Take a screenshot of the table
    await page.screenshot({ path: outputFilePath });

    await browser.close();
}

// Example usage
const htmlContent = `
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
        }

        th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
        }

        th {
            background-color: #f2f2f2;
        }
    </style>
    <table>
        <tr>
            <th>Header 1</th>
            <th>Header 2</th>
        </tr>
        <tr>
            <td>Row 1, Column 1</td>
            <td>Row 1, Column 2</td>
        </tr>
        <tr>
            <td>Row 2, Column 1</td>
            <td>Row 2, Column 2</td>
        </tr>
    </table>
`;

const outputFilePath = 'table.png';

generateImage(htmlContent, outputFilePath)
    .then(() => console.log('Image generated successfully'))
    .catch(err => console.error('Error generating image:', err));
