with open(r'D:\Work\School\Year 3\CambridgeHack\hackcambridge-ccleaner-extension-master\src\user_agents.txt') as infile:
    for line in infile:
        print('"'+line.replace('\n','') +'",')