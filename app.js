const express = require('express');
const app = require('express')();
const httpServer = require('http').createServer(app);
const dotenv = require('dotenv');
dotenv.config();
const neo4j = require('neo4j-driver');
const XLSX = require('xlsx');
const neo4j_app = require('./neo4j/index'); 
// const io = require('socket.io')(httpServer, {
//   cors: {origin : '*'}
// });
// const { Kafka } = require('kafkajs')

const port = process.env.PORT || 8082;


app.use(express.static('public'));


// Create a driver instance
const driver = neo4j.driver(
  'neo4j://localhost:7687', // Replace with your database URI
  neo4j.auth.basic('neo4j', 'Aswin_1906') // Replace with your database username and password
);

// Create a session
const session = driver.session();



// // Replace './data.xlsx' with the path to your actual Excel file
// processExcelFile('./subject_category_alphabetical_index_2019.xlsx').catch(console.error);


// Endpoint to trigger loadAllData
app.post('/load-all-data-wo-subgroup', async (req, res) => {
  neo4j_app.load_all_wo_subgroup_data('./subject_category_alphabetical_index_2019.xlsx')
  .then(() => {
    console.log('Data import completed successfully.');
    res.json({ success: true });
  })
  .catch(error => {
    console.error('Error during data import:', error);
    res.status(500).send({ success: false });
  });  
});


// Endpoint to trigger loadAllData
app.post('/load-all-data', async (req, res) => {
  neo4j_app.load_all_scg_data('./subject_category_alphabetical_index_2019.xlsx')
  .then(() => {
    console.log('Data import completed successfully.');
    res.json({ success: true });
  })
  .catch(error => {
    console.error('Error during data import:', error);
    res.status(500).send({ success: false });
  });  
});

app.post('/load-all-data-reverse-mapping', async (req, res) => {
  neo4j_app.load_all_scg_data_reverse_mapping('./subject_category_alphabetical_index_2019.xlsx')
  .then(() => {
    console.log('Data import completed successfully.');
    res.json({ success: true });
  })
  .catch(error => {
    console.error('Error during data import:', error);
    res.status(500).send({ success: false });
  });  
});

app.post('/load-ner-data-4m-gpt4', async (req, res) => {

  neo4j_app.createNerGraph('./redacted_under_25_years_ner.json')
  .then(() => {
    console.log('NER Graph created successfully');
    res.json({ success: true });
  })
  .catch(error => {
    console.error('Error during data import:', error);
    res.status(500).send({ success: false });
  });  
});

// Endpoint to trigger deleteAllData
app.post('/delete-all-data', async (req, res) => {
  const result = await neo4j_app.deleteAllData();
  res.json(result);
});

app.get('/', (req, res) => {
  res.send('Nodejs App Started..')
});

httpServer.listen(port, () => console.log(`listening on port ${port}`));