import json
    
def get_login_info():
    with open('../project/public/login.json', 'r') as file:
        return json.load(file)

def login(login_info):

    username = login_info[0]
    password = login_info[1]

    if not username or not password:
        raise ValueError("Username and password are required")
    
    with open('../project/public/users.json', 'r') as file:
        users = json.load(file)
        if username in users and users[username] == password:
            print("Login successful")
                # login logic here
        else: print("Invalid username or password")

def add_user(username, password):
    # Read the existing data from the file
    with open('../project/public/users.json', 'r') as file:
        users = json.load(file)

    # Append the new user data
    users[username] = password

    # Write the updated data back to the file
    with open('../project/public/users.json', 'w') as file:
        json.dump(users, file, indent=2)

if __name__ == "__main__":
    login(get_login_info())