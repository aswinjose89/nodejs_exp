
const neo4j = require('neo4j-driver');
const XLSX = require('xlsx');
const fs = require('fs');

// Create a driver instance
const driver = neo4j.driver(
    'neo4j://localhost:7687', // Replace with your database URI
    neo4j.auth.basic('neo4j', 'Aswin_1906') // Replace with your database username and password
  );
  
  // Create a session
  const session = driver.session();
  
  
  // Function to read Excel file and convert to JSON
  function readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetNameList = workbook.SheetNames;
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
  }
  async function createNodesAndRelationships(data) {
    for (const row of data) {
      const query = `
        MERGE (field:Field {name: $fieldName})
        MERGE (group:Group {name: $groupName})
        MERGE (term:Term {name: $termName})
        MERGE (field)-[:HAS_GROUP]->(group)
        MERGE (group)-[:HAS_TERM]->(term)
      `;
      const params = {
        fieldName: row['Field Name'],
        groupName: row['Group Name'],
        termName: row['Term']
      };
  
      try {
        await session.run(query, params);
      } catch (error) {
        console.error('Error creating nodes and relationships:', error);
      }
    }
  
    console.log('All data processed successfully.');
  }
  
  // Main function to process the Excel file
  async function processExcelFile(filePath) {
    const data = readExcelFile(filePath);
    await createNodesAndRelationships(data);
    await session.close();
    driver.close();
  }
  
  // Replace './data.xlsx' with the path to your actual Excel file
//   processExcelFile('./subject_category_alphabetical_index_2019.xlsx').catch(console.error);

async function load_all_wo_subgroup_data(filePath) {
    const session = driver.session();
    const data = readExcelFile(filePath);
    for (const row of data) {
        const query = `
            MERGE (field:Field {name: $fieldName})
            MERGE (group:Group {name: $groupName})
            MERGE (term:Term {name: $termName})
            MERGE (field)-[:HAS_GROUP]->(group)
            MERGE (group)-[:HAS_TERM]->(term)
        `;
        const params = {
            fieldName: row['Field Name'],
            groupName: row['Group Name'],
            termName: row['Term']
        };
    
        try {
          await session.run(query, params);
        } catch (error) {
          console.error('Error importing data from Excel:', error);
        }
      }
    
      await session.close();
}

async function load_all_scg_data(filePath) {
    const session = driver.session();
    const data = readExcelFile(filePath);
  
    for (const row of data) {
      const query = `
        MERGE (field:Field {name: $fieldName})
        MERGE (group:Group {name: $groupName})
        MERGE (subGroup:SubGroup {id: $subGroupId})
        MERGE (term:Term {name: $termName})
        MERGE (field)-[:HAS_GROUP]->(group)
        MERGE (group)-[:HAS_SUBGROUP]->(subGroup)
        MERGE (subGroup)-[:HAS_TERM]->(term)
      `;
      const params = {
        fieldName: row['Field Name'],
        groupName: row['Group Name'],
        subGroupId: (row['Sub-Group ID'] == undefined)? -1:row['Sub-Group ID'],
        termName: row['Term']
      };
  
      try {
        await session.run(query, params);
      } catch (error) {
        console.error('Error importing data from Excel:', error);
      }
    }
  
    await session.close();
  }

  async function load_all_scg_data_reverse_mapping(filePath) {
    const session = driver.session();
    const data = readExcelFile(filePath);
  
    for (const row of data) {
      const query = `
      MERGE (term:Term {name: $termName})
      MERGE (subGroup:SubGroup {id: $subGroupId})
      MERGE (group:Group {name: $groupName})
      MERGE (field:Field {name: $fieldName})
      MERGE (term)-[:HAS_SUBGROUP]->(subGroup)
      MERGE (subGroup)-[:BELONGS_TO_GROUP]->(group)
      MERGE (group)-[:UNDER_FIELD]->(field)
      `;
      const params = {
        fieldName: row['Field Name'],
        groupName: row['Group Name'],
        subGroupId: (row['Sub-Group ID'] == undefined)? -1:row['Sub-Group ID'],
        termName: row['Term']
      };
  
      try {
        await session.run(query, params);
      } catch (error) {
        console.error('Error importing data from Excel:', error);
      }
    }
  
    await session.close();
  }

  async function loadJsonlAsync(filePath) {
    // Create an array to hold the data
    const data = [];
  
    // Create a readable stream for the file
    const fileStream = fs.createReadStream(filePath);
  
    // Create a readline interface
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // Recognize all instances of CR LF ('\r\n') as a single line break.
    });
  
    // Process each line
    for await (const line of rl) {
      // Parse the line as JSON and add to the data array
      data.push(JSON.parse(line));
    }
  
    // Return the collected data
    return data;
  }



  function loadJsonFileSync(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error("An error occurred while loading the JSON file:", err);
      throw err; // Rethrow to allow caller to handle the error
    }
  }

  function checkPropertyType(obj, propertyName) {
    // Check if the property exists
    if (obj.hasOwnProperty(propertyName)) {
      const value = obj[propertyName];
      
      // Check if the property is an array
      if (Array.isArray(value)) {
        return 'array';
      }
      // Check if the property is an object (and not null)
      else if (typeof value === 'object' && value !== null) {
        return 'object';
      }
      // If not an array or object, return the actual type
      else {
        return typeof value;
      }
    } else {
      return 'property does not exist';
    }
  }

  // Function to create nodes and relationships from JSON data
  async function createNerGraph(filePath) {
    const session = driver.session();
    const jsonDocuments= loadJsonFileSync(filePath)  
    try {
        let count= 0
        for (const doc of jsonDocuments) {
            if([2010070101936, 2007050101302, 2008050101292].includes(doc.id)){
                continue;
            }
            console.log(`${count++}.processing ${doc.id}`)
            for (const item of doc["body"]) {
                // Create Sentence node
                // const sentenceResult = await session.run(
                //   'CREATE (s:Sentence {text: $text}) RETURN s',
                //   { text: item.sentence }
                // );
                // const sentenceNode = sentenceResult.records[0].get(0);
                if (item.hasOwnProperty("entities")){                
                    for (const entity of item.entities) {
                        // const query = `
                        //     MERGE (c:Category {name: $category})
                        //     WITH c CREATE (c)-[:HAS_ENTITY]->(e:Entity {name: $value, id: $id})
                        //     WITH e MATCH (s:Sentence {text: $text})
                        //     CREATE (s)-[:MENTIONS]->(e)
                        // `;
                        const query = `
                            MERGE (docNode:Document {name: $title, publisher: $publisher, id: $doc_id})
                            MERGE (sentenceNode:Sentence {name: $text})
                            MERGE (entityNode:Entity {name: $entity_value, id: $entity_id})
                            MERGE (categoryNode:Category {name: $category})     
                            MERGE (docNode)-[:HAS_SENTENCE]->(sentenceNode)           
                            MERGE (sentenceNode)-[:HAS_ENTITY]->(entityNode)
                            MERGE (entityNode)-[:HAS_CATEGORY]->(categoryNode)
                        `;
                        const params = {
                            title: doc.title,
                            publisher: doc.publisher,
                            doc_id: doc.id,
                            text: item.sentence,
                            entity_value: entity.entity_value, 
                            entity_id: entity.id,
                            category: entity.category,                               
                        };
            
                        await session.run(query, params);
                    // Create or merge Category node and create relationship to Sentence
                    //   await session.run(
                    //     'MERGE (c:Category {name: $category}) ' +
                    //     'WITH c CREATE (c)-[:HAS_ENTITY]->(e:Entity {name: $value, id: $id}) ' +
                    //     'WITH e MATCH (s:Sentence {text: $text}) ' +
                    //     'CREATE (s)-[:MENTIONS]->(e)',
                    //     { category: entity.category, id: entity.id, value: entity.entity_value, text: item.sentence }
                    //   );
                    }
                }
                if (item.hasOwnProperty("entity_relationship") && item.entity_relationship !=null ){
                    const propertytype= checkPropertyType(item, "entity_relationship")
                    if (propertytype== 'object'
                    && item.entity_relationship.source && item.entity_relationship.target){
                        const label= item.entity_relationship.label.replace(/\s/g, '_').replace(/\./g, '').replace(/\-/g, '_');
                        // Create relationship between entities
                        await session.run(
                            'MATCH (e1:Entity {id: $source}), (e2:Entity {id: $target}) ' +
                            'CREATE (e1)-[r:' + label.toUpperCase() + ']->(e2)',
                            { source: item.entity_relationship.source, target: item.entity_relationship.target }
                        );
                    }
                    else if (propertytype== 'array'){
                        for (const relationship of item.entity_relationship){
                            const label= relationship.label.replace(/\s/g, '_').replace(/\./g, '').replace(/\-/g, '_');
                            await session.run(
                                'MATCH (e1:Entity {id: $source}), (e2:Entity {id: $target}) ' +
                                'CREATE (e1)-[r:' + label.toUpperCase() + ']->(e2)',
                                { source: relationship.source, target: relationship.target }
                            );
                        }
                    }
                }
        
                // if (item.entity_relationship && item.entity_relationship.source && item.entity_relationship.target) {
                // // Create relationship between entities
                // await session.run(
                //     'MATCH (e1:Entity {id: $source}), (e2:Entity {id: $target}) ' +
                //     'CREATE (e1)-[r:' + item.entity_relationship.label.toUpperCase() + ']->(e2)',
                //     { source: item.entity_relationship.source, target: item.entity_relationship.target }
                // );
                // }
            }
            
        }
      
    } catch (error) {
      console.error('Error creating the graph:', error);
    } finally {
      await session.close();
    }
  }


async function deleteAllData() {
    const session = driver.session();
    try {
        await session.run('MATCH (n) DETACH DELETE n');
        console.log('All data has been deleted.');
        return { success: true };
    } catch (error) {
        console.error('Error deleting data:', error);
        return { success: false, error: error.message };
    } finally {
        await session.close();
    }
}
  
  // Export all functions as an object
module.exports = { deleteAllData, load_all_scg_data, load_all_wo_subgroup_data, 
    load_all_scg_data_reverse_mapping, createNerGraph };