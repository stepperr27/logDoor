--Create Accesses and Customers tables
CREATE TABLE Accesses (
    cardUUID varchar(8) NOT NULL,
    opening_time TIMESTAMP DEFAULT (unixepoch('now')) NOT NULL,
  	alarm bool NOT NULL,
    FOREIGN KEY (cardUUID) -- Link with customers tables
       REFERENCES Customers (cardUUID) 
);

CREATE TABLE Customers (
    cardUUID varchar(8) NOT NULL,
    doorID int NOT NULL,
    name varchar(255) NOT NULL,
    PRIMARY KEY (cardUUID)
);

CREATE TABLE Users (
    username varchar(16) NOT NULL,
    password varchar(16) NOT NULL
);

-- Insert dummy data
INSERT INTO Customers (cardUUID, doorID, name) VALUES ('4A57A6E8', 3, 'Mario Rossi');
INSERT INTO Accesses (carduuid, alarm) VALUES ('4A57A6E8', 0);
INSERT INTO Accesses (carduuid, opening_time, alarm) VALUES ('4A57A6E8', unixepoch('now')-1000, 1);
INSERT INTO Users (username, password) VALUES ('admin', 'admin1234');

-- Select query
SELECT Accesses.cardUUID, Customers.doorID, Customers.name, strftime('%d/%m/%Y, %H:%M', datetime(Accesses.opening_time, 'unixepoch')) as opening_time, Accesses.alarm FROM Accesses INNER JOIN Customers ON Customers.cardUUID=Accesses.cardUUID ORDER BY Accesses.opening_time DESC
