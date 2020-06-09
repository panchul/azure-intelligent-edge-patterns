#!/usr/bin/env bash
set -euo pipefail

install() {
  echo "Running Kubeflow install script"

  export KF_CTL_DIR=$1
  export KF_NAME=$2
  export KF_USERNAME=$3
  export KFCTL_RELEASE_URI=$4
  export KF_DIR=$5
  export KF_CONFIG_URI=$6

  echo "KF_CTL_DIR: $KF_CTL_DIR"
  echo "KF_NAME: $KF_NAME" 
  echo "KF_USERNAME: $KF_USERNAME" 
  echo "KFCTL_RELEASE_URI: $KFCTL_RELEASE_URI"
  echo "KF_DIR: $KF_DIR"
  echo "KF_CONFIG_URI=: $KF_CONFIG_URI"

#  echo "#--- Kubeflow config" >> ~/.bashrc
#  echo "export PATH=\$PATH:${KF_CTL_DIR}" >> ~/.bashrc
#  echo "export KF_DIR=${KF_DIR}" >> ~/.bashrc
#  echo "export KF_CONFIG_FILENAME=${KF_CONFIG_FILENAME}" >> ~/.bashrc
#  echo "#--- Kubeflow config end" >> ~/.bashrc

#  echo "Creating the dir for kfctl, $KF_CTL_DIR"
#  mkdir -p $KF_CTL_DIR || exit 2
#  cd $KF_CTL_DIR  || exit 2
#  wget $KFCTL_RELEASE_URI || exit 2
#  tar -xvf ${KFCTL_RELEASE_FILENAME} || exit 2
# sudo mkdir -p ${KF_DIR} || exit2
#  sudo chown ${KF_USERNAME} ${KF_DIR}  || exit 2
#  cd ${KF_DIR}  || exit 2
#  kfctl apply -V -f ${KF_CONFIG_URI}  || exit 2
}

uninstall() {
  echo "Running Kubeflow uninstall script"
# TODO:
}

# Call the requested function and pass the arguments as-is
"$@"
