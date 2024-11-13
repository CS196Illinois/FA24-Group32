import json


def get_register_info():
    with open('../project/public/register.json', 'r') as file:
        return json.load(file)

def register(register_info):
    
    username = register_info[0]
    password = register_info[1]

    if not username or not password:
        raise ValueError("Username and password are required")
    
    with open('../project/public/users.json', 'r') as file:
        users = json.load(file)

        for i in users:
            if username == i["username"]:
                print("Username already exists")
                return
        user = [{"username": username, "password": password}]
        add_user(user)
        print("Registration successful")
        # if username in users.username:
        #     print("Username already exists")
        # else:
        #     user = [{"username": username, "password": password}]
        #     add_user(user)
        #     print("Registration successful")

def add_user(user):
    # Read the existing data from the file
    with open('../project/public/users.json', 'r') as file:
        users = json.load(file)

    # Append the new user data
    users.extend(user)

    # Write the updated data back to the file
    with open('../project/public/users.json', 'w') as file:
        json.dump(users, file, indent=2)

if __name__ == "__main__":
    register(get_register_info())