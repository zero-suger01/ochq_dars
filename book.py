user_name=open("/Users/suger01/Desktop/7_sinf/read.txt")
neymar=user_name.read()
names = neymar.split(", ")
for name in names:
    if name.startswith("A"):  
       print(name)  

