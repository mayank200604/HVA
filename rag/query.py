     while True:
        try:
            user_query = input("\nEnter your query (or type 'exit'/'quit' to stop): ")
            if user_query.lower() in ["exit", "quit"]:
                break
            
            if not user_query.strip():
                continue
                
            print("\nProcessing...")
            result = generate_rag_response(user_query)
            
            print("\n--- Answer ---")
            print(result["answer"])
            
            print("\n--- Sources ---")
            if result["sources"]:
                for source in result["sources"]:
                    print(f"- {source}")
            else:
                print("No relevant sources found.")
                
            print("\n--------------")
            
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    run_query_loop()
