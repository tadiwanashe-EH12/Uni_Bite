<?php
class DatabaseService {
    private $connection;

    public function __construct() {
        // Create database connection
        $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        // Check connection
        if ($this->connection->connect_error) {
            die("Connection failed: " . $this->connection->connect_error);
        }
    }

    public function query($sql, $params = []) {
        // Prepare statement
        $stmt = $this->connection->prepare($sql);
        
        if ($stmt === false) {
            throw new Exception("Error preparing statement: " . $this->connection->error);
        }

        // Bind parameters if any
        if (!empty($params)) {
            $types = '';
            $values = [];
            
            foreach ($params as $param) {
                if (is_int($param)) {
                    $types .= 'i';
                } elseif (is_float($param)) {
                    $types .= 'd';
                } else {
                    $types .= 's';
                }
                $values[] = $param;
            }
            
            array_unshift($values, $types);
            call_user_func_array([$stmt, 'bind_param'], $this->refValues($values));
        }

        // Execute query
        $stmt->execute();
        
        // Get result
        $result = $stmt->get_result();
        
        // For SELECT queries, return the data
        if ($result) {
            $data = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            return $data;
        }
        
        // For INSERT/UPDATE/DELETE, return affected rows
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        return $affectedRows;
    }

    // Helper function for reference values
    private function refValues($arr) {
        $refs = [];
        foreach ($arr as $key => $value) {
            $refs[$key] = &$arr[$key];
        }
        return $refs;
    }

    public function close() {
        $this->connection->close();
    }
}
?>