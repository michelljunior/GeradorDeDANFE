const Danfe = require('./Modulos/DANFE/index')
const fs = require('fs')
const bwipjs = require('bwip-js');
const puppeteer = require('puppeteer');


var args = process.argv.slice(2);

var caminhoXML = args[1];
var codigoNotaFiscal = args[3];
var CaminhoArquivoPDF = args[5];


var danfe = Danfe.fromFile(caminhoXML)
let htmlPdf = danfe.toHtml()

function GerarCodigoDeBarras (text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: false,
        textxalign: 'center'
    }, function(error, buffer) {
        if(error) {
            reject(error)
        } else {
            let gifBase64 = `data:image/gif;base64,${buffer.toString('base64')}`
            htmlPdf = htmlPdf.replace(/CODIGO_DE_BARRAS/gi, gifBase64)

            fs.writeFile('text.html', htmlPdf, (err) => {
              if (err) {
                console.error('Ocorreu um erro ao salvar o arquivo:', err);
                return;
              }
              console.log('Texto salvo com sucesso!');
            });

            (async () => {

              const browser = await puppeteer.launch({
                executablePath: '/root/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],

            });
              const page = await browser.newPage();

              // Defina o caminho para o arquivo PDF de saída
              const pdfPath = CaminhoArquivoPDF;

              // Defina as opções de impressão
              const options = {
                path: pdfPath,
                format: 'A4',
                displayHeaderFooter: true,
                footerTemplate: `<div id="footer-template" style="font-size:10px !important; color:#808080; padding-left:50px">Documento gerado por <a href="https://datasynchro.com.br">DataSynchro</a></div>`,
                margin: {
                  top: '30px',
                  bottom: '30px',
                  right: '30px',
                  left: '30px',
                },
              };

              // Configure a página com o conteúdo HTML
              
              await page.setContent(htmlPdf);
              await page.setViewport({width: 1080, height: 1024});
              // Gere o PDF
              await page.pdf(options);

              console.log('PDF gerado com sucesso:', pdfPath);

              await browser.close();
            })();
            resolve(gifBase64)
        }
    })
})
}

GerarCodigoDeBarras(codigoNotaFiscal)
