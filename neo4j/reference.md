docker run --rm -it -p 7474:7474 -p 7687:7687 neo4j:5.11



MATCH (n:Field) WHERE n.name = 'Military Sciences' RETURN n

MATCH (n) RETURN n LIMIT 25

MATCH (u:User) DETACH DELETE u

MATCH (a:Term)-[r]->(b:SubGroup)-[k]->(c:Group)
WHERE a.name = 'Pepper Spray' AND b.id = 3.0 AND c.name = 'Chemical, Biological and Radiological Warfare'
RETURN a, b, c