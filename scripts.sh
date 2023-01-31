GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"
WHSPACE="  "

build_extension() {
    echo "${GREEN}Packing into zip file...${NC}"
    python3 package_chrome.py

    echo "${GREEN}Unpacking zip file to \"chrome-extension\"${NC}"
    unzip chrome* -d chrome-extension

    echo "${GREEN}Removing zip file...${NC}"
    rm chrome-extension.zip
}

if [[ $1 == "--build" ]]
then
    echo "${GREEN}Building extension...${NC}"
    build_extension

elif [[ $1 == "--clean" ]]
then
    echo "${YELLOW}Cleaning...${NC}"
    rm -R chrome*

elif [[ $1 == "--rebuild" ]]
then
    echo "${GREEN}Cleaning old build...${NC}"
    rm -R chrome*

    build_extension
    
elif [[ $1 == "--help" ]]
then
    echo "${WHSPACE}${YELLOW}--build:${NC} Generate the chrome extension and unpack"
    echo "${WHSPACE}${YELLOW}--clean:${NC} Remove all files/folders with names starting with \"chrome*\""
    echo "${WHSPACE}${YELLOW}--rebuild:${NC} Remove old built and build a new one"
else
    echo "An argument is required. Please use \"sh build --help\" to see available options"
fi