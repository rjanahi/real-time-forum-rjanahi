package main

import (
	"fmt"
	"forum/database"
	web "forum/web"
	"log"
)

func main() {
	db := database.ConnectToDatabase()

	if err := database.CreateTables(db); err != nil {
		log.Fatalf("❌ Error creating tables: %v", err)
	}

	fmt.Println("✅ Database tables checked and initialized.")
	web.ConnectWeb(db)
}
