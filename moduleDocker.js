function launchListCommandRec(docker, imageName, argsList, index) {
    if (index > argsList.length) {
        return;
    }

    docker.run(imageName, ['bash', '-c', argsList[index]], process.stdout)
    .then(container => {
        launchListCommandRec(docker, imageName, argsList, index + 1);
    })
}

module.exports = {
    create: (docker) => {
        return docker.createContainer({
            Image: 'ubuntu',
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ['/bin/bash'],
            OpenStdin: false,
            StdinOnce: false
        })
    },


    exec: (container, cmd) => {
            return;

    },


    launchCommand: (docker, imageName, cmd) => {
        docker.run(imageName, ['bash', '-c', cmd], process.stdout)
        // .then(container => {
        //     console.log(container.output.StatusCode);
        // })
    },

    launchListCommand: (docker, imageName, argsList) => {
        if (argsList.length == 0) {
            return;
        }
return;
        launchListCommandRec(docker, imageName, argsList, 0);
    }
}